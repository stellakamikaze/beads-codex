import { html } from 'lit-html';
import { createIssueIdRenderer } from '../utils/issue-id-renderer.js';
import { statusLabel } from '../utils/status.js';
import { createTypeBadge } from '../utils/type-badge.js';

/**
 * @typedef {{ id: string, title?: string, status?: string, issue_type?: string, project?: string }} IssueRowData
 */

/**
 * Create a reusable issue row renderer used by list and epics views.
 * Handles inline editing for title and selects for status.
 *
 * @param {{
 *   navigate: (id: string) => void,
 *   onUpdate: (id: string, patch: { title?: string, status?: 'open'|'in_progress'|'closed' }) => Promise<void>,
 *   requestRender: () => void,
 *   getSelectedId?: () => string | null,
 *   row_class?: string
 * }} options
 * @returns {(it: IssueRowData) => import('lit-html').TemplateResult<1>}
 */
export function createIssueRowRenderer(options) {
  const navigate = options.navigate;
  const on_update = options.onUpdate;
  const request_render = options.requestRender;
  const get_selected_id = options.getSelectedId || (() => null);
  const row_class = options.row_class || 'issue-row';

  /** @type {Set<string>} */
  const editing = new Set();

  /**
   * @param {string} id
   * @param {'title'} key
   * @param {string} value
   */
  function editableText(id, key, value) {
    const k = `${id}:${key}`;
    const is_edit = editing.has(k);
    if (is_edit) {
      return html`<span>
        <input
          type="text"
          .value=${value}
          class="inline-edit"
          @keydown=${
            /** @param {KeyboardEvent} e */ async (e) => {
              if (e.key === 'Escape') {
                editing.delete(k);
                request_render();
              } else if (e.key === 'Enter') {
                const el = /** @type {HTMLInputElement} */ (e.currentTarget);
                const next = el.value || '';
                if (next !== value) {
                  await on_update(id, { [key]: next });
                }
                editing.delete(k);
                request_render();
              }
            }
          }
          @blur=${
            /** @param {Event} ev */ async (ev) => {
              const el = /** @type {HTMLInputElement} */ (ev.currentTarget);
              const next = el.value || '';
              if (next !== value) {
                await on_update(id, { [key]: next });
              }
              editing.delete(k);
              request_render();
            }
          }
          autofocus
        />
      </span>`;
    }
    return html`<span
      class="editable text-truncate ${value ? '' : 'muted'}"
      tabindex="0"
      role="button"
      @click=${
        /** @param {MouseEvent} e */ (e) => {
          e.stopPropagation();
          e.preventDefault();
          editing.add(k);
          request_render();
        }
      }
      @keydown=${
        /** @param {KeyboardEvent} e */ (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            editing.add(k);
            request_render();
          }
        }
      }
      >${value}</span
    >`;
  }

  /**
   * @param {string} id
   * @returns {(ev: Event) => Promise<void>}
   */
  function makeStatusChange(id) {
    return async (ev) => {
      const sel = /** @type {HTMLSelectElement} */ (ev.currentTarget);
      const val = sel.value || '';
      await on_update(id, { status: /** @type {'open'|'in_progress'|'closed'} */ (val) });
    };
  }

  /**
   * @param {string} id
   * @returns {(ev: Event) => void}
   */
  function makeRowClick(id) {
    return (ev) => {
      const el = /** @type {HTMLElement|null} */ (ev.target);
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT')) {
        return;
      }
      navigate(id);
    };
  }

  /**
   * @param {IssueRowData} it
   */
  function rowTemplate(it) {
    const cur_status = String(it.status || 'open');
    const is_selected = get_selected_id() === it.id;
    return html`<tr
      role="row"
      class="${row_class} ${is_selected ? 'selected' : ''}"
      data-issue-id=${it.id}
      @click=${makeRowClick(it.id)}
    >
      <td role="gridcell" class="mono">${createIssueIdRenderer(it.id)}</td>
      <td role="gridcell">${createTypeBadge(it.issue_type)}</td>
      <td role="gridcell">${editableText(it.id, 'title', it.title || '')}</td>
      <td role="gridcell">
        <select
          class="badge-select badge--status is-${cur_status}"
          .value=${cur_status}
          @change=${makeStatusChange(it.id)}
        >
          ${['open', 'in_progress', 'closed'].map(
            (s) =>
              html`<option value=${s} ?selected=${cur_status === s}>
                ${statusLabel(s)}
              </option>`
          )}
        </select>
      </td>
    </tr>`;
  }

  return rowTemplate;
}
