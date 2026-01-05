// server/notes-api.js - API routes for project notes
import { Router } from 'express';
import {
  readNotes,
  updateStateOfArt,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addTemplate
} from './notes-storage.js';
import { getCurrentWorkspace } from './workspace-state.js';
import { debug } from './logging.js';

const log = debug('notes-api');

/**
 * Create notes API router.
 *
 * @returns {Router}
 */
export function createNotesRouter() {
  const router = Router();

  /**
   * Get workspace path or send 400 error.
   *
   * @param {import('express').Response} res
   * @returns {string | null}
   */
  function getWorkspaceOrError(res) {
    const workspace = getCurrentWorkspace();
    if (!workspace || !workspace.root_dir) {
      res.status(400).json({ ok: false, error: 'No workspace selected' });
      return null;
    }
    return workspace.root_dir;
  }

  // GET /api/notes - Get all notes for current workspace
  router.get('/', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    try {
      const notes = readNotes(workspace_path);
      log('GET /api/notes for %s', workspace_path);
      res.json({ ok: true, data: notes });
    } catch (err) {
      log('error getting notes: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to read notes' });
    }
  });

  // PUT /api/notes/state-of-art - Update state of art
  router.put('/state-of-art', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    const { content } = req.body || {};
    if (typeof content !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing content' });
      return;
    }

    try {
      const notes = updateStateOfArt(workspace_path, content);
      log('PUT /api/notes/state-of-art for %s', workspace_path);
      res.json({ ok: true, data: notes.state_of_art });
    } catch (err) {
      log('error updating state of art: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to update state of art' });
    }
  });

  // GET /api/notes/questions - List questions
  router.get('/questions', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    try {
      const notes = readNotes(workspace_path);
      log('GET /api/notes/questions for %s (%d questions)', workspace_path, notes.questions.length);
      res.json({ ok: true, data: notes.questions });
    } catch (err) {
      log('error getting questions: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to read questions' });
    }
  });

  // POST /api/notes/questions - Add question
  router.post('/questions', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    const { question, category } = req.body || {};
    if (!question || typeof question !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing question' });
      return;
    }

    try {
      const newQuestion = addQuestion(workspace_path, { question, category });
      log('POST /api/notes/questions for %s: %s', workspace_path, newQuestion.id);
      res.status(201).json({ ok: true, data: newQuestion });
    } catch (err) {
      log('error adding question: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to add question' });
    }
  });

  // PUT /api/notes/questions/:id - Update question
  router.put('/questions/:id', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    const { id } = req.params;
    const { question, answer, category } = req.body || {};

    try {
      const updated = updateQuestion(workspace_path, id, { question, answer, category });
      if (!updated) {
        res.status(404).json({ ok: false, error: 'Question not found' });
        return;
      }
      log('PUT /api/notes/questions/%s for %s', id, workspace_path);
      res.json({ ok: true, data: updated });
    } catch (err) {
      log('error updating question: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to update question' });
    }
  });

  // DELETE /api/notes/questions/:id - Delete question
  router.delete('/questions/:id', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    const { id } = req.params;

    try {
      const deleted = deleteQuestion(workspace_path, id);
      if (!deleted) {
        res.status(404).json({ ok: false, error: 'Question not found' });
        return;
      }
      log('DELETE /api/notes/questions/%s for %s', id, workspace_path);
      res.json({ ok: true });
    } catch (err) {
      log('error deleting question: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to delete question' });
    }
  });

  // GET /api/notes/templates - Get question templates
  router.get('/templates', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    try {
      const notes = readNotes(workspace_path);
      log('GET /api/notes/templates for %s', workspace_path);
      res.json({ ok: true, data: notes.question_templates });
    } catch (err) {
      log('error getting templates: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to read templates' });
    }
  });

  // POST /api/notes/templates - Add template
  router.post('/templates', (req, res) => {
    const workspace_path = getWorkspaceOrError(res);
    if (!workspace_path) return;

    const { question, category } = req.body || {};
    if (!question || typeof question !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing question' });
      return;
    }

    try {
      const template = addTemplate(workspace_path, { question, category });
      log('POST /api/notes/templates for %s', workspace_path);
      res.status(201).json({ ok: true, data: template });
    } catch (err) {
      log('error adding template: %o', err);
      res.status(500).json({ ok: false, error: 'Failed to add template' });
    }
  });

  return router;
}
