// app/views/notes.js - Notes view for project state of art
import { html, render } from 'lit-html';
import { renderMarkdown } from '../utils/markdown.js';
import { debug } from '../utils/logging.js';

const log = debug('views:notes');

/**
 * @typedef {Object} NotesState
 * @property {string} content
 * @property {string} updated_at
 * @property {boolean} editing
 * @property {boolean} saving
 * @property {string} editContent
 */

/**
 * Create the Notes view component.
 *
 * @param {HTMLElement} mount_element
 * @param {{ getState: () => any, subscribe: (fn: (s: any) => void) => () => void, setState: (patch: any) => void }} store
 */
export function createNotesView(mount_element, store) {
  log('creating notes view');

  /** @type {(() => void) | null} */
  let unsubscribe = null;

  /** @type {NotesState} */
  let localState = {
    content: '',
    updated_at: '',
    editing: false,
    saving: false,
    editContent: ''
  };

  /** @type {ReturnType<typeof setTimeout> | null} */
  let autoSaveTimer = null;

  /**
   * Load notes from API.
   */
  async function loadNotes() {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.ok && data.data) {
        localState.content = data.data.state_of_art?.content || '';
        localState.updated_at = data.data.state_of_art?.updated_at || '';
        localState.editContent = localState.content;
        doRender();
      }
    } catch (err) {
      log('failed to load notes: %o', err);
    }
  }

  /**
   * Save notes to API.
   */
  async function saveNotes() {
    if (localState.saving) return;

    localState.saving = true;
    doRender();

    try {
      const res = await fetch('/api/notes/state-of-art', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: localState.editContent })
      });
      const data = await res.json();
      if (data.ok) {
        localState.content = localState.editContent;
        localState.updated_at = data.data?.updated_at || new Date().toISOString();
        localState.editing = false;
      }
    } catch (err) {
      log('failed to save notes: %o', err);
    } finally {
      localState.saving = false;
      doRender();
    }
  }

  /**
   * Format relative time.
   *
   * @param {string} isoDate
   * @returns {string}
   */
  function formatRelativeTime(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString('it-IT');
  }

  /**
   * Handle edit button click.
   */
  function onEdit() {
    localState.editing = true;
    localState.editContent = localState.content;
    doRender();

    // Focus textarea after render
    setTimeout(() => {
      const textarea = mount_element.querySelector('.notes-editor__textarea');
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      }
    }, 0);
  }

  /**
   * Handle cancel button click.
   */
  function onCancel() {
    localState.editing = false;
    localState.editContent = localState.content;
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    doRender();
  }

  /**
   * Handle textarea input.
   *
   * @param {Event} ev
   */
  function onInput(ev) {
    const textarea = ev.target;
    if (textarea instanceof HTMLTextAreaElement) {
      localState.editContent = textarea.value;

      // Auto-save after 2 seconds of inactivity
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      autoSaveTimer = setTimeout(() => {
        saveNotes();
      }, 2000);
    }
  }

  /**
   * Handle save button click.
   */
  function onSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    saveNotes();
  }

  function template() {
    const s = store.getState();
    const projectName = s.workspace?.current?.path?.split('/').pop() || 'Progetto';

    if (localState.editing) {
      return html`
        <div class="notes-view">
          <div class="notes-header">
            <h2 class="notes-title">STATO DELL'ARTE - ${projectName.toUpperCase()}</h2>
            <div class="notes-actions">
              <button class="btn btn--secondary" @click=${onCancel} ?disabled=${localState.saving}>
                Annulla
              </button>
              <button class="btn btn--primary" @click=${onSave} ?disabled=${localState.saving}>
                ${localState.saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
          <div class="notes-editor">
            <textarea
              class="notes-editor__textarea"
              .value=${localState.editContent}
              @input=${onInput}
              placeholder="Descrivi lo stato attuale del progetto, le funzionalità implementate, lo stack tecnologico..."
            ></textarea>
            <p class="notes-editor__hint">
              Supporta Markdown. Auto-salvataggio dopo 2 secondi di inattività.
            </p>
          </div>
        </div>
      `;
    }

    const renderedContent = localState.content
      ? renderMarkdown(localState.content)
      : html`<p class="notes-empty">Nessuna descrizione. Clicca "Modifica" per aggiungere lo stato dell'arte del progetto.</p>`;

    return html`
      <div class="notes-view">
        <div class="notes-header">
          <h2 class="notes-title">STATO DELL'ARTE - ${projectName.toUpperCase()}</h2>
          <div class="notes-actions">
            <button class="btn btn--primary" @click=${onEdit}>
              Modifica
            </button>
          </div>
        </div>
        <div class="notes-content markdown-body">
          ${renderedContent}
        </div>
        ${localState.updated_at ? html`
          <div class="notes-footer">
            Ultimo aggiornamento: ${formatRelativeTime(localState.updated_at)}
          </div>
        ` : ''}
      </div>
    `;
  }

  function doRender() {
    render(template(), mount_element);
  }

  // Initial load
  loadNotes();
  doRender();

  // Subscribe to store changes (workspace changes)
  unsubscribe = store.subscribe((state) => {
    // Reload notes when workspace changes
    if (state.workspace_changed) {
      loadNotes();
    }
    doRender();
  });

  return {
    destroy() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      render(html``, mount_element);
    },
    reload() {
      loadNotes();
    }
  };
}
