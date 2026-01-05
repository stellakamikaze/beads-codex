// app/views/questions.js - Questions view for development guidance
import { html, render } from 'lit-html';
import { debug } from '../utils/logging.js';

const log = debug('views:questions');

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

const CATEGORY_ICONS = {
  roadmap: '🎯',
  bugs: '🐛',
  architecture: '🏗️',
  design: '🎨',
  testing: '🧪',
  general: '💬'
};

const CATEGORY_NAMES = {
  roadmap: 'Roadmap',
  bugs: 'Bug',
  architecture: 'Architettura',
  design: 'Design',
  testing: 'Testing',
  general: 'Generale'
};

/**
 * Create the Questions view component.
 *
 * @param {HTMLElement} mount_element
 * @param {{ getState: () => any, subscribe: (fn: (s: any) => void) => () => void }} store
 */
export function createQuestionsView(mount_element, store) {
  log('creating questions view');

  /** @type {(() => void) | null} */
  let unsubscribe = null;

  /** @type {Question[]} */
  let questions = [];

  /** @type {QuestionTemplate[]} */
  let templates = [];

  /** @type {string | null} */
  let editingId = null;

  /** @type {string} */
  let editingAnswer = '';

  /** @type {boolean} */
  let saving = false;

  /** @type {boolean} */
  let showNewForm = false;

  /** @type {string} */
  let newQuestion = '';

  /** @type {string} */
  let newCategory = 'general';

  /**
   * Load questions from API.
   */
  async function loadQuestions() {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.ok && data.data) {
        questions = data.data.questions || [];
        templates = data.data.question_templates || [];
        doRender();
      }
    } catch (err) {
      log('failed to load questions: %o', err);
    }
  }

  /**
   * Save answer for a question.
   *
   * @param {string} id
   * @param {string} answer
   */
  async function saveAnswer(id, answer) {
    saving = true;
    doRender();

    try {
      const res = await fetch(`/api/notes/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      const data = await res.json();
      if (data.ok) {
        const idx = questions.findIndex(q => q.id === id);
        if (idx !== -1) {
          questions[idx] = data.data;
        }
        editingId = null;
        editingAnswer = '';
      }
    } catch (err) {
      log('failed to save answer: %o', err);
    } finally {
      saving = false;
      doRender();
    }
  }

  /**
   * Add a new question.
   */
  async function addQuestion() {
    if (!newQuestion.trim()) return;

    saving = true;
    doRender();

    try {
      const res = await fetch('/api/notes/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion.trim(),
          category: newCategory
        })
      });
      const data = await res.json();
      if (data.ok) {
        questions.push(data.data);
        newQuestion = '';
        newCategory = 'general';
        showNewForm = false;
      }
    } catch (err) {
      log('failed to add question: %o', err);
    } finally {
      saving = false;
      doRender();
    }
  }

  /**
   * Delete a question.
   *
   * @param {string} id
   */
  async function deleteQuestion(id) {
    if (!confirm('Eliminare questa domanda?')) return;

    try {
      const res = await fetch(`/api/notes/questions/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        questions = questions.filter(q => q.id !== id);
        doRender();
      }
    } catch (err) {
      log('failed to delete question: %o', err);
    }
  }

  /**
   * Add question from template.
   *
   * @param {QuestionTemplate} template
   */
  async function addFromTemplate(template) {
    newQuestion = template.question;
    newCategory = template.category;
    showNewForm = true;
    doRender();

    // Focus the textarea
    setTimeout(() => {
      const textarea = mount_element.querySelector('.new-question__input');
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
        textarea.select();
      }
    }, 0);
  }

  /**
   * Start editing a question's answer.
   *
   * @param {Question} question
   */
  function startEditing(question) {
    editingId = question.id;
    editingAnswer = question.answer || '';
    doRender();

    // Focus textarea
    setTimeout(() => {
      const textarea = mount_element.querySelector(`[data-question-id="${question.id}"] textarea`);
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      }
    }, 0);
  }

  /**
   * Cancel editing.
   */
  function cancelEditing() {
    editingId = null;
    editingAnswer = '';
    doRender();
  }

  /**
   * Render a single question card.
   *
   * @param {Question} question
   */
  function renderQuestion(question) {
    const isEditing = editingId === question.id;
    const icon = CATEGORY_ICONS[question.category] || CATEGORY_ICONS.general;
    const categoryName = CATEGORY_NAMES[question.category] || 'Generale';

    return html`
      <div class="question-card" data-question-id="${question.id}">
        <div class="question-card__header">
          <span class="question-card__category">
            ${icon} ${categoryName}
          </span>
          <button
            class="btn btn--icon btn--danger"
            @click=${() => deleteQuestion(question.id)}
            title="Elimina domanda"
          >
            ✕
          </button>
        </div>
        <div class="question-card__question">
          Q: ${question.question}
        </div>
        <div class="question-card__answer">
          ${isEditing ? html`
            <textarea
              class="question-card__textarea"
              .value=${editingAnswer}
              @input=${(/** @type {Event} */ e) => {
                if (e.target instanceof HTMLTextAreaElement) {
                  editingAnswer = e.target.value;
                }
              }}
              placeholder="Scrivi la tua risposta..."
              ?disabled=${saving}
            ></textarea>
            <div class="question-card__actions">
              <button
                class="btn btn--secondary"
                @click=${cancelEditing}
                ?disabled=${saving}
              >
                Annulla
              </button>
              <button
                class="btn btn--primary"
                @click=${() => saveAnswer(question.id, editingAnswer)}
                ?disabled=${saving}
              >
                ${saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          ` : html`
            ${question.answer ? html`
              <div class="question-card__answer-text">${question.answer}</div>
              <button class="btn btn--link" @click=${() => startEditing(question)}>
                Modifica risposta
              </button>
            ` : html`
              <button class="btn btn--primary" @click=${() => startEditing(question)}>
                Rispondi
              </button>
            `}
          `}
        </div>
        ${question.answered_at ? html`
          <div class="question-card__meta">
            Risposto: ${new Date(question.answered_at).toLocaleDateString('it-IT')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function template() {
    const s = store.getState();
    const projectName = s.workspace?.current?.path?.split('/').pop() || 'Progetto';

    // Group questions by category
    const grouped = questions.reduce((/** @type {Record<string, Question[]>} */ acc, q) => {
      const cat = q.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(q);
      return acc;
    }, {});

    return html`
      <div class="questions-view">
        <div class="questions-header">
          <h2 class="questions-title">DOMANDE PER LO SVILUPPO - ${projectName.toUpperCase()}</h2>
          <button
            class="btn btn--primary"
            @click=${() => { showNewForm = !showNewForm; doRender(); }}
          >
            ${showNewForm ? 'Chiudi' : '+ Nuova Domanda'}
          </button>
        </div>

        ${showNewForm ? html`
          <div class="new-question">
            <div class="new-question__form">
              <select
                class="new-question__category"
                .value=${newCategory}
                @change=${(/** @type {Event} */ e) => {
                  if (e.target instanceof HTMLSelectElement) {
                    newCategory = e.target.value;
                    doRender();
                  }
                }}
              >
                ${Object.entries(CATEGORY_NAMES).map(([key, name]) => html`
                  <option value="${key}" ?selected=${newCategory === key}>
                    ${CATEGORY_ICONS[key]} ${name}
                  </option>
                `)}
              </select>
              <textarea
                class="new-question__input"
                .value=${newQuestion}
                @input=${(/** @type {Event} */ e) => {
                  if (e.target instanceof HTMLTextAreaElement) {
                    newQuestion = e.target.value;
                  }
                }}
                placeholder="Scrivi la tua domanda..."
              ></textarea>
              <button
                class="btn btn--primary"
                @click=${addQuestion}
                ?disabled=${saving || !newQuestion.trim()}
              >
                ${saving ? 'Aggiunta...' : 'Aggiungi'}
              </button>
            </div>

            ${templates.length > 0 ? html`
              <div class="new-question__templates">
                <span class="new-question__templates-label">Suggerimenti:</span>
                ${templates.map(t => html`
                  <button
                    class="btn btn--ghost"
                    @click=${() => addFromTemplate(t)}
                  >
                    ${CATEGORY_ICONS[t.category]} ${t.question.slice(0, 40)}${t.question.length > 40 ? '...' : ''}
                  </button>
                `)}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${questions.length === 0 ? html`
          <div class="questions-empty">
            <p>Nessuna domanda ancora. Clicca "+ Nuova Domanda" per iniziare.</p>
            <p class="questions-empty__hint">
              Le domande ti aiutano a guidare lo sviluppo del progetto.
              Claude Code leggerà queste domande e le tue risposte per capire cosa implementare.
            </p>
          </div>
        ` : html`
          <div class="questions-list">
            ${Object.entries(grouped).map(([category, categoryQuestions]) => html`
              <div class="questions-category">
                <h3 class="questions-category__title">
                  ${CATEGORY_ICONS[category]} ${CATEGORY_NAMES[category] || category}
                </h3>
                ${categoryQuestions.map(q => renderQuestion(q))}
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  function doRender() {
    render(template(), mount_element);
  }

  // Initial load
  loadQuestions();
  doRender();

  // Subscribe to store changes
  unsubscribe = store.subscribe((state) => {
    if (state.workspace_changed) {
      loadQuestions();
    }
    doRender();
  });

  return {
    destroy() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      render(html``, mount_element);
    },
    reload() {
      loadQuestions();
    }
  };
}
