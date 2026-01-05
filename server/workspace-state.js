// server/workspace-state.js - Shared workspace state
import path from 'node:path';
import { resolveDbPath } from './db.js';
import { debug } from './logging.js';

const log = debug('workspace-state');

/**
 * @typedef {Object} WorkspaceState
 * @property {string} root_dir
 * @property {string} db_path
 */

/** @type {WorkspaceState | null} */
let currentWorkspace = null;

/**
 * Initialize the workspace state.
 *
 * @param {string} root_dir
 */
export function initWorkspace(root_dir) {
  const db_info = resolveDbPath({ cwd: root_dir });
  currentWorkspace = {
    root_dir: path.resolve(root_dir),
    db_path: db_info.path
  };
  log('workspace initialized: %s', currentWorkspace.root_dir);
}

/**
 * Get the current workspace.
 *
 * @returns {WorkspaceState | null}
 */
export function getCurrentWorkspace() {
  return currentWorkspace;
}

/**
 * Set the current workspace.
 *
 * @param {string} root_dir
 * @returns {WorkspaceState}
 */
export function setCurrentWorkspace(root_dir) {
  const resolved = path.resolve(root_dir);
  const db_info = resolveDbPath({ cwd: resolved });
  currentWorkspace = {
    root_dir: resolved,
    db_path: db_info.path
  };
  log('workspace changed: %s', currentWorkspace.root_dir);
  return currentWorkspace;
}
