// server/sync-api.js - Sync API for Claude Code instances
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { debug } from './logging.js';

const log = debug('sync-api');

// Beads database path from env
const BEADS_DB = process.env.BEADS_DB || '/data/.beads/beads.db';

/** @type {Map<string, any>} */
const beadsStore = new Map();

/** @type {Set<(event: {type: string, data: any}) => void>} */
const changeListeners = new Set();

/**
 * Load beads from the SQLite database file
 * @returns {any[]}
 */
function loadBeadsFromDb() {
  try {
    if (!fs.existsSync(BEADS_DB)) {
      log('beads database does not exist: %s', BEADS_DB);
      return [];
    }
    // For now, we'll use a simple JSON-based sync store
    // In production, this would read from SQLite
    const syncFile = path.join(path.dirname(BEADS_DB), 'sync-store.json');
    if (fs.existsSync(syncFile)) {
      const data = JSON.parse(fs.readFileSync(syncFile, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err) {
    log('error loading beads: %o', err);
    return [];
  }
}

/**
 * Save beads to the sync store
 * @param {any[]} beads
 */
function saveBeadsToStore(beads) {
  try {
    const syncDir = path.dirname(BEADS_DB);
    if (!fs.existsSync(syncDir)) {
      fs.mkdirSync(syncDir, { recursive: true });
    }
    const syncFile = path.join(syncDir, 'sync-store.json');
    fs.writeFileSync(syncFile, JSON.stringify(beads, null, 2));
    log('saved %d beads to sync store', beads.length);
  } catch (err) {
    log('error saving beads: %o', err);
  }
}

/**
 * Notify all change listeners
 * @param {string} type
 * @param {any} data
 */
function notifyChange(type, data) {
  const event = { type, data, timestamp: Date.now() };
  for (const listener of changeListeners) {
    try {
      listener(event);
    } catch (err) {
      log('error notifying listener: %o', err);
    }
  }
}

/**
 * Create sync API router for Claude Code instances
 * @returns {Router}
 */
export function createSyncRouter() {
  const router = Router();

  // Initialize beads store from disk
  const initialBeads = loadBeadsFromDb();
  for (const bead of initialBeads) {
    if (bead.id) {
      beadsStore.set(bead.id, bead);
    }
  }
  log('loaded %d beads from store', beadsStore.size);

  // GET /api/sync/status - Get sync status
  router.get('/status', (_req, res) => {
    res.json({
      ok: true,
      beadsCount: beadsStore.size,
      timestamp: Date.now()
    });
  });

  // GET /api/sync/pull - Pull all beads from server
  router.get('/pull', (req, res) => {
    const since = req.query.since ? parseInt(String(req.query.since), 10) : 0;

    const beads = Array.from(beadsStore.values());

    // Filter by timestamp if provided
    const filtered = since > 0
      ? beads.filter(b => (b.updated_at || b.created_at || 0) > since)
      : beads;

    log('pull: returning %d beads (since=%d)', filtered.length, since);

    res.json({
      ok: true,
      beads: filtered,
      timestamp: Date.now(),
      total: beadsStore.size
    });
  });

  // POST /api/sync/push - Push beads changes to server
  router.post('/push', (req, res) => {
    const { beads, source } = req.body || {};

    if (!Array.isArray(beads)) {
      res.status(400).json({ ok: false, error: 'beads must be an array' });
      return;
    }

    const user = /** @type {any} */ (req).user;
    const username = user?.username || 'anonymous';
    const sourceId = source || 'unknown';

    log('push from %s (%s): %d beads', username, sourceId, beads.length);

    const created = [];
    const updated = [];
    const conflicts = [];

    for (const bead of beads) {
      if (!bead.id) {
        continue;
      }

      const existing = beadsStore.get(bead.id);

      if (!existing) {
        // New bead
        const newBead = {
          ...bead,
          synced_at: Date.now(),
          synced_by: username,
          synced_from: sourceId
        };
        beadsStore.set(bead.id, newBead);
        created.push(newBead);
      } else {
        // Check for conflicts (simple last-write-wins for now)
        const existingTime = existing.updated_at || existing.created_at || 0;
        const incomingTime = bead.updated_at || bead.created_at || 0;

        if (incomingTime >= existingTime) {
          // Incoming is newer, update
          const updatedBead = {
            ...bead,
            synced_at: Date.now(),
            synced_by: username,
            synced_from: sourceId
          };
          beadsStore.set(bead.id, updatedBead);
          updated.push(updatedBead);
        } else {
          // Existing is newer, conflict
          conflicts.push({
            id: bead.id,
            existing_time: existingTime,
            incoming_time: incomingTime,
            resolution: 'kept_existing'
          });
        }
      }
    }

    // Persist to disk
    saveBeadsToStore(Array.from(beadsStore.values()));

    // Notify listeners for real-time sync
    if (created.length > 0 || updated.length > 0) {
      notifyChange('beads-sync', {
        created,
        updated,
        source: sourceId,
        user: username
      });
    }

    res.json({
      ok: true,
      created: created.length,
      updated: updated.length,
      conflicts: conflicts.length,
      conflictDetails: conflicts,
      timestamp: Date.now()
    });
  });

  // DELETE /api/sync/bead/:id - Delete a specific bead
  router.delete('/bead/:id', (req, res) => {
    const { id } = req.params;

    if (!beadsStore.has(id)) {
      res.status(404).json({ ok: false, error: 'Bead not found' });
      return;
    }

    const user = /** @type {any} */ (req).user;
    const username = user?.username || 'anonymous';

    beadsStore.delete(id);
    saveBeadsToStore(Array.from(beadsStore.values()));

    log('deleted bead %s by %s', id, username);

    notifyChange('bead-deleted', { id, user: username });

    res.json({ ok: true, deleted: id });
  });

  // GET /api/sync/bead/:id - Get a specific bead
  router.get('/bead/:id', (req, res) => {
    const { id } = req.params;
    const bead = beadsStore.get(id);

    if (!bead) {
      res.status(404).json({ ok: false, error: 'Bead not found' });
      return;
    }

    res.json({ ok: true, bead });
  });

  return router;
}

/**
 * Subscribe to sync changes
 * @param {(event: {type: string, data: any}) => void} listener
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToChanges(listener) {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/**
 * Get current beads count
 * @returns {number}
 */
export function getBeadsCount() {
  return beadsStore.size;
}

/**
 * Get the shared beads store (for chat-api integration)
 * @returns {Map<string, any>}
 */
export function getBeadsStore() {
  return beadsStore;
}

/**
 * Save store to disk (for use by other modules)
 */
export function persistStore() {
  saveBeadsToStore(Array.from(beadsStore.values()));
}
