/**
 * REST API for Claude Code instances
 *
 * Endpoints:
 * - GET  /api/issues                    - List all issues
 * - GET  /api/issues/pending            - Issues with pending instructions
 * - GET  /api/issues/:id                - Get issue detail with comments
 * - PUT  /api/issues/:id/status         - Update issue status
 * - POST /api/issues/:id/comments       - Add comment to issue
 * - POST /api/issues/:id/complete       - Mark instruction as completed
 */
import { Router } from 'express';
import { runBd, runBdJson, getGitUserName } from './bd.js';
import { debug } from './logging.js';

const log = debug('api');

const INSTRUCTION_PREFIX = '[ISTRUZIONE] ';
const COMPLETED_PREFIX = '[COMPLETATO] ';

/**
 * Token auth middleware
 * Checks for Bearer token in Authorization header or X-Codex-Token header
 * Token is validated against CODEX_TOKEN env var
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function tokenAuth(req, res, next) {
  const expected = process.env.CODEX_TOKEN;

  // If no token configured, allow all requests (development mode)
  if (!expected) {
    log('auth: no CODEX_TOKEN configured, allowing request');
    next();
    return;
  }

  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token === expected) {
      log('auth: valid Bearer token');
      next();
      return;
    }
  }

  // Check X-Codex-Token header
  const xToken = req.headers['x-codex-token'];
  if (xToken === expected) {
    log('auth: valid X-Codex-Token');
    next();
    return;
  }

  // Check query param (for simple curl usage)
  if (req.query.token === expected) {
    log('auth: valid query token');
    next();
    return;
  }

  log('auth: unauthorized request');
  res.status(401).json({
    ok: false,
    error: 'Unauthorized',
    message: 'Valid CODEX_TOKEN required'
  });
}

/**
 * Transform comments to include is_instruction flag and strip prefix
 * @param {any[]} comments
 */
function transformComments(comments) {
  return (comments || []).map((c) => ({
    ...c,
    is_instruction: typeof c.text === 'string' && c.text.startsWith(INSTRUCTION_PREFIX),
    is_completed: typeof c.text === 'string' && c.text.startsWith(COMPLETED_PREFIX),
    text: typeof c.text === 'string' && c.text.startsWith(INSTRUCTION_PREFIX)
      ? c.text.slice(INSTRUCTION_PREFIX.length)
      : typeof c.text === 'string' && c.text.startsWith(COMPLETED_PREFIX)
        ? c.text.slice(COMPLETED_PREFIX.length)
        : c.text
  }));
}

/**
 * Create REST API router for Claude Code instances
 * @returns {Router}
 */
export function createApiRouter() {
  const router = Router();

  // Apply token auth to all routes
  router.use(tokenAuth);

  // GET /api/issues - List all issues
  router.get('/issues', async (req, res) => {
    log('GET /issues');

    const status = req.query.status;
    const args = ['list', '--json'];

    if (status && typeof status === 'string') {
      args.push('--status', status);
    }

    const result = await runBdJson(args);

    if (result.code !== 0) {
      res.status(500).json({
        ok: false,
        error: 'bd_error',
        message: result.stderr || 'Failed to list issues'
      });
      return;
    }

    res.json({
      ok: true,
      issues: result.stdoutJson || [],
      count: Array.isArray(result.stdoutJson) ? result.stdoutJson.length : 0
    });
  });

  // GET /api/issues/pending - Issues with pending instructions
  router.get('/issues/pending', async (req, res) => {
    log('GET /issues/pending');

    // Get all open and in_progress issues
    const listResult = await runBdJson(['list', '--json']);

    if (listResult.code !== 0) {
      res.status(500).json({
        ok: false,
        error: 'bd_error',
        message: listResult.stderr || 'Failed to list issues'
      });
      return;
    }

    const issues = /** @type {any[]} */ (listResult.stdoutJson || []);
    const pending = [];

    // Check each issue for pending instructions
    for (const issue of issues) {
      if (issue.status === 'closed') continue;

      const commentsResult = await runBdJson(['comments', issue.id, '--json']);
      if (commentsResult.code !== 0) continue;

      const comments = transformComments(commentsResult.stdoutJson || []);
      const pendingInstructions = comments.filter(
        (c) => c.is_instruction && !c.is_completed
      );

      if (pendingInstructions.length > 0) {
        pending.push({
          ...issue,
          comments,
          pending_instructions: pendingInstructions,
          pending_count: pendingInstructions.length
        });
      }
    }

    res.json({
      ok: true,
      issues: pending,
      count: pending.length,
      total_pending: pending.reduce((sum, i) => sum + i.pending_count, 0)
    });
  });

  // GET /api/issues/:id - Get issue detail with comments
  router.get('/issues/:id', async (req, res) => {
    const { id } = req.params;
    log('GET /issues/%s', id);

    // Get issue detail
    const showResult = await runBdJson(['show', id, '--json']);

    if (showResult.code !== 0) {
      res.status(404).json({
        ok: false,
        error: 'not_found',
        message: showResult.stderr || `Issue ${id} not found`
      });
      return;
    }

    // Get comments
    const commentsResult = await runBdJson(['comments', id, '--json']);
    const comments = commentsResult.code === 0
      ? transformComments(commentsResult.stdoutJson || [])
      : [];

    const issue = showResult.stdoutJson;

    res.json({
      ok: true,
      issue: {
        ...issue,
        comments,
        pending_instructions: comments.filter((c) => c.is_instruction && !c.is_completed)
      }
    });
  });

  // PUT /api/issues/:id/status - Update issue status
  router.put('/issues/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    log('PUT /issues/%s/status → %s', id, status);

    const allowed = ['open', 'in_progress', 'closed'];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: `status must be one of: ${allowed.join(', ')}`
      });
      return;
    }

    const result = await runBd(['update', id, '--status', status]);

    if (result.code !== 0) {
      res.status(500).json({
        ok: false,
        error: 'bd_error',
        message: result.stderr || 'Failed to update status'
      });
      return;
    }

    // Return updated issue
    const showResult = await runBdJson(['show', id, '--json']);

    res.json({
      ok: true,
      issue: showResult.stdoutJson
    });
  });

  // POST /api/issues/:id/comments - Add comment to issue
  router.post('/issues/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { text, is_instruction, author: reqAuthor } = req.body || {};
    log('POST /issues/%s/comments (instruction=%s)', id, !!is_instruction);

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: 'text is required'
      });
      return;
    }

    // Prefix with [ISTRUZIONE] if marked as instruction
    const finalText = is_instruction
      ? INSTRUCTION_PREFIX + text.trim()
      : text.trim();

    // Get author from request or git config
    const author = reqAuthor || await getGitUserName() || 'Claude Code';

    const args = ['comment', id, finalText];
    if (author) {
      args.push('--author', author);
    }

    const result = await runBd(args);

    if (result.code !== 0) {
      res.status(500).json({
        ok: false,
        error: 'bd_error',
        message: result.stderr || 'Failed to add comment'
      });
      return;
    }

    // Return updated comments
    const commentsResult = await runBdJson(['comments', id, '--json']);
    const comments = transformComments(commentsResult.stdoutJson || []);

    res.json({
      ok: true,
      comments,
      added: {
        text: text.trim(),
        is_instruction,
        author
      }
    });
  });

  // POST /api/issues/:id/complete - Mark instruction as completed with result
  router.post('/issues/:id/complete', async (req, res) => {
    const { id } = req.params;
    const { instruction_id, result: resultText, author: reqAuthor } = req.body || {};
    log('POST /issues/%s/complete', id);

    if (!resultText || typeof resultText !== 'string') {
      res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: 'result text is required'
      });
      return;
    }

    // Add completion comment
    const finalText = COMPLETED_PREFIX + resultText.trim();
    const author = reqAuthor || await getGitUserName() || 'Claude Code';

    const args = ['comment', id, finalText];
    if (author) {
      args.push('--author', author);
    }

    const result = await runBd(args);

    if (result.code !== 0) {
      res.status(500).json({
        ok: false,
        error: 'bd_error',
        message: result.stderr || 'Failed to add completion comment'
      });
      return;
    }

    // Return updated comments
    const commentsResult = await runBdJson(['comments', id, '--json']);
    const comments = transformComments(commentsResult.stdoutJson || []);

    res.json({
      ok: true,
      comments,
      completed: {
        instruction_id,
        result: resultText.trim(),
        author
      }
    });
  });

  // POST /api/issues - Create new issue
  router.post('/issues', async (req, res) => {
    const { title, type, description } = req.body || {};
    log('POST /issues title=%s', title);

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: 'title is required'
      });
      return;
    }

    const args = ['create', title.trim()];

    if (type && ['bug', 'feature', 'task', 'epic', 'chore'].includes(type)) {
      args.push('-t', type);
    }

    if (description && typeof description === 'string') {
      args.push('-d', description);
    }

    const result = await runBd(args);

    if (result.code !== 0) {
      res.status(500).json({
        ok: false,
        error: 'bd_error',
        message: result.stderr || 'Failed to create issue'
      });
      return;
    }

    // Extract issue ID from output (format: "✓ Created issue: UI-xxxx")
    const match = result.stdout.match(/Created issue:\s*(\S+)/);
    const newId = match ? match[1] : null;

    res.status(201).json({
      ok: true,
      created: true,
      id: newId,
      title: title.trim()
    });
  });

  return router;
}
