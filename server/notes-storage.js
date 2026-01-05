// server/notes-storage.js - Read/write project notes alongside beads DB
import fs from 'node:fs';
import path from 'node:path';
import { debug } from './logging.js';

const log = debug('notes-storage');

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} question
 * @property {string} answer
 * @property {string} category
 * @property {string} [answered_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} QuestionTemplate
 * @property {string} id
 * @property {string} question
 * @property {string} category
 */

/**
 * @typedef {Object} ProjectNotes
 * @property {{ content: string, updated_at: string }} state_of_art
 * @property {Question[]} questions
 * @property {QuestionTemplate[]} question_templates
 */

const DEFAULT_TEMPLATES = [
  { id: 't1', question: 'Qual è la prossima feature da implementare?', category: 'roadmap' },
  { id: 't2', question: 'Ci sono bug noti da risolvere?', category: 'bugs' },
  { id: 't3', question: 'Quali decisioni architetturali sono in sospeso?', category: 'architecture' },
  { id: 't4', question: 'Come vuoi gestire [specifico aspetto]?', category: 'design' },
  { id: 't5', question: 'Quali test mancano?', category: 'testing' }
];

/**
 * Get the path to project-notes.json for a workspace.
 *
 * @param {string} workspace_path - Path to the workspace root
 * @returns {string}
 */
export function getNotesPath(workspace_path) {
  return path.join(workspace_path, '.beads', 'project-notes.json');
}

/**
 * Create default notes structure.
 *
 * @returns {ProjectNotes}
 */
function createDefaultNotes() {
  return {
    state_of_art: {
      content: '',
      updated_at: new Date().toISOString()
    },
    questions: [],
    question_templates: DEFAULT_TEMPLATES
  };
}

/**
 * Read project notes for a workspace.
 *
 * @param {string} workspace_path
 * @returns {ProjectNotes}
 */
export function readNotes(workspace_path) {
  const notes_path = getNotesPath(workspace_path);

  try {
    if (!fs.existsSync(notes_path)) {
      log('notes file not found, returning defaults: %s', notes_path);
      return createDefaultNotes();
    }

    const content = fs.readFileSync(notes_path, 'utf8');
    const data = JSON.parse(content);

    // Ensure all required fields exist
    return {
      state_of_art: data.state_of_art || { content: '', updated_at: new Date().toISOString() },
      questions: data.questions || [],
      question_templates: data.question_templates || DEFAULT_TEMPLATES
    };
  } catch (err) {
    log('error reading notes: %o', err);
    return createDefaultNotes();
  }
}

/**
 * Write project notes for a workspace.
 *
 * @param {string} workspace_path
 * @param {ProjectNotes} notes
 */
export function writeNotes(workspace_path, notes) {
  const notes_path = getNotesPath(workspace_path);
  const beads_dir = path.dirname(notes_path);

  // Ensure .beads directory exists
  if (!fs.existsSync(beads_dir)) {
    log('creating .beads directory: %s', beads_dir);
    fs.mkdirSync(beads_dir, { recursive: true });
  }

  const content = JSON.stringify(notes, null, 2);
  fs.writeFileSync(notes_path, content, 'utf8');
  log('wrote notes to: %s', notes_path);
}

/**
 * Update state of art content.
 *
 * @param {string} workspace_path
 * @param {string} content
 * @returns {ProjectNotes}
 */
export function updateStateOfArt(workspace_path, content) {
  const notes = readNotes(workspace_path);
  notes.state_of_art = {
    content,
    updated_at: new Date().toISOString()
  };
  writeNotes(workspace_path, notes);
  return notes;
}

/**
 * Generate a unique question ID.
 *
 * @returns {string}
 */
function generateQuestionId() {
  return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Add a new question.
 *
 * @param {string} workspace_path
 * @param {{ question: string, category?: string }} data
 * @returns {Question}
 */
export function addQuestion(workspace_path, data) {
  const notes = readNotes(workspace_path);
  const question = {
    id: generateQuestionId(),
    question: data.question,
    answer: '',
    category: data.category || 'general',
    created_at: new Date().toISOString()
  };
  notes.questions.push(question);
  writeNotes(workspace_path, notes);
  return question;
}

/**
 * Update a question (answer or edit).
 *
 * @param {string} workspace_path
 * @param {string} question_id
 * @param {{ question?: string, answer?: string, category?: string }} updates
 * @returns {Question | null}
 */
export function updateQuestion(workspace_path, question_id, updates) {
  const notes = readNotes(workspace_path);
  const idx = notes.questions.findIndex(q => q.id === question_id);

  if (idx === -1) {
    log('question not found: %s', question_id);
    return null;
  }

  const question = notes.questions[idx];

  if (updates.question !== undefined) {
    question.question = updates.question;
  }
  if (updates.answer !== undefined) {
    question.answer = updates.answer;
    if (updates.answer) {
      question.answered_at = new Date().toISOString();
    }
  }
  if (updates.category !== undefined) {
    question.category = updates.category;
  }

  notes.questions[idx] = question;
  writeNotes(workspace_path, notes);
  return question;
}

/**
 * Delete a question.
 *
 * @param {string} workspace_path
 * @param {string} question_id
 * @returns {boolean}
 */
export function deleteQuestion(workspace_path, question_id) {
  const notes = readNotes(workspace_path);
  const idx = notes.questions.findIndex(q => q.id === question_id);

  if (idx === -1) {
    return false;
  }

  notes.questions.splice(idx, 1);
  writeNotes(workspace_path, notes);
  return true;
}

/**
 * Add a question template.
 *
 * @param {string} workspace_path
 * @param {{ question: string, category?: string }} data
 * @returns {QuestionTemplate}
 */
export function addTemplate(workspace_path, data) {
  const notes = readNotes(workspace_path);
  const template = {
    id: 't' + Date.now().toString(36),
    question: data.question,
    category: data.category || 'general'
  };
  notes.question_templates.push(template);
  writeNotes(workspace_path, notes);
  return template;
}
