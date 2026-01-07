import { html, render } from 'lit-html';
import { t } from '../i18n.js';
import { renderMarkdown } from '../utils/markdown.js';
import { createTypeBadge } from '../utils/type-badge.js';

/**
 * @typedef {{ id: string, title?: string, description?: string, status?: string, issue_type?: string, project?: string, created_at?: number, closed_at?: number }} IssueForStats
 */

/**
 * Extract project name from path
 * @param {string} path
 * @returns {string}
 */
function getProjectName(path) {
  if (!path) return '(no project)';
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : '(no project)';
}

/**
 * About/Landing page with Dashboard explaining how Codex works
 * @param {HTMLElement} container
 * @param {{ snapshotFor?: (client_id: string) => IssueForStats[], subscribe?: (fn: () => void) => () => void }} [issueStores]
 */
export function createAboutView(container, issueStores) {
  /** @type {IssueForStats[]} */
  let issues = [];
  /** @type {(() => void) | null} */
  let unsubscribe = null;

  // Swiper state
  /** @type {number} */
  let swiperIndex = 0;
  /** @type {'idle'|'swipe-left'|'swipe-right'} */
  let swiperAnimation = 'idle';

  /**
   * Get open issues for the swiper
   * @returns {IssueForStats[]}
   */
  function getOpenIssues() {
    return issues.filter(i => i.status === 'open' || i.status === 'in_progress' || !i.status);
  }

  /**
   * Handle swipe/skip to next issue
   * @param {'left'|'right'} direction
   */
  function handleSwipe(direction) {
    const openIssues = getOpenIssues();
    if (openIssues.length === 0) return;

    swiperAnimation = direction === 'left' ? 'swipe-left' : 'swipe-right';
    renderView();

    setTimeout(() => {
      swiperAnimation = 'idle';
      swiperIndex = (swiperIndex + 1) % openIssues.length;
      renderView();
    }, 200);
  }

  /**
   * Handle marking issue as done (closed)
   * @param {string} id
   */
  async function handleMarkDone(id) {
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });
      if (res.ok) {
        // Refresh issues
        const apiIssues = await fetchIssuesFromApi();
        if (apiIssues.length > 0) {
          issues = apiIssues;
          // Adjust index if needed
          const openIssues = getOpenIssues();
          if (swiperIndex >= openIssues.length) {
            swiperIndex = Math.max(0, openIssues.length - 1);
          }
          renderView();
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Navigate to issue detail
   * @param {string} id
   */
  function openIssueDetail(id) {
    window.location.hash = `#/issues/${id}`;
  }

  /** @type {string} */
  let commentText = '';

  /**
   * Handle comment input change
   * @param {Event} ev
   */
  function onCommentInput(ev) {
    const input = /** @type {HTMLTextAreaElement} */ (ev.currentTarget);
    commentText = input.value;
  }

  /**
   * Send comment/instruction for current issue
   * @param {string} id
   */
  async function handleSendComment(id) {
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/issues/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentText.trim(),
          is_instruction: true
        })
      });
      if (res.ok) {
        // Clear comment and move to next
        commentText = '';
        handleSwipe('right');
      }
    } catch {
      // ignore
    }
  }

  /**
   * Render the issue swiper section
   */
  function renderSwiper() {
    const openIssues = getOpenIssues();

    if (openIssues.length === 0) {
      return html`
        <section class="issue-swiper">
          <h2 class="about-section-title">Issue Review</h2>
          <div class="issue-swiper__empty">
            <div class="issue-swiper__empty-icon">[OK]</div>
            <p>Nessuna issue aperta da revisionare</p>
          </div>
        </section>
      `;
    }

    const currentIssue = openIssues[swiperIndex];
    const cardClass = swiperAnimation !== 'idle' ? swiperAnimation : '';

    return html`
      <section class="issue-swiper">
        <div class="issue-swiper__header">
          <h2 class="about-section-title" style="margin-bottom:0">Issue Review</h2>
          <span class="issue-swiper__counter">${swiperIndex + 1} / ${openIssues.length}</span>
        </div>

        <div class="issue-swiper__card ${cardClass}">
          <div class="issue-swiper__meta">
            <span class="issue-swiper__id">${currentIssue.id}</span>
            ${createTypeBadge(currentIssue.issue_type || 'task')}
            <span class="issue-swiper__project">${getProjectName(currentIssue.project || '')}</span>
          </div>
          <h3 class="issue-swiper__title">${currentIssue.title || '(untitled)'}</h3>
          <div class="issue-swiper__description">
            ${currentIssue.description ? renderMarkdown(currentIssue.description) : ''}
          </div>
        </div>

        <div class="issue-swiper__comment">
          <textarea
            class="issue-swiper__textarea"
            placeholder="Scrivi un'istruzione per Claude..."
            .value=${commentText}
            @input=${onCommentInput}
            @keydown=${(/** @type {KeyboardEvent} */ ev) => {
              if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
                ev.preventDefault();
                handleSendComment(currentIssue.id);
              }
            }}
          ></textarea>
          <button
            class="issue-swiper__send-btn"
            ?disabled=${!commentText.trim()}
            @click=${() => handleSendComment(currentIssue.id)}
          >
            Invia e Avanti
          </button>
        </div>

        <div class="issue-swiper__actions">
          <button class="issue-swiper__btn issue-swiper__btn--skip" @click=${() => handleSwipe('left')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Skip
          </button>
          <button class="issue-swiper__btn issue-swiper__btn--open" @click=${() => openIssueDetail(currentIssue.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Apri
          </button>
          <button class="issue-swiper__btn issue-swiper__btn--done" @click=${() => handleMarkDone(currentIssue.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Chiudi
          </button>
        </div>

        <div class="issue-swiper__hints">
          <span class="issue-swiper__hint"><kbd>←</kbd> Skip</span>
          <span class="issue-swiper__hint"><kbd>Enter</kbd> Apri</span>
          <span class="issue-swiper__hint"><kbd>Ctrl+Enter</kbd> Invia</span>
          <span class="issue-swiper__hint"><kbd>→</kbd> Chiudi</span>
        </div>
      </section>
    `;
  }

  /**
   * Compute statistics from issues
   * @param {IssueForStats[]} items
   */
  function computeStats(items) {
    const total = items.length;
    const open = items.filter(i => i.status === 'open' || !i.status).length;
    const in_progress = items.filter(i => i.status === 'in_progress').length;
    const closed = items.filter(i => i.status === 'closed').length;

    // Group by project
    /** @type {Record<string, number>} */
    const byProject = {};
    for (const item of items) {
      const proj = item.project || '(no project)';
      byProject[proj] = (byProject[proj] || 0) + 1;
    }

    // Group by type
    /** @type {Record<string, number>} */
    const byType = {};
    for (const item of items) {
      const type = item.issue_type || 'task';
      byType[type] = (byType[type] || 0) + 1;
    }

    // Timeline: issues created in last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    /** @type {Record<string, { created: number, closed: number }>} */
    const timeline = {};
    for (let d = 0; d < 30; d++) {
      const date = new Date(now - d * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      timeline[key] = { created: 0, closed: 0 };
    }
    for (const item of items) {
      if (item.created_at && item.created_at > thirtyDaysAgo) {
        const key = new Date(item.created_at).toISOString().split('T')[0];
        if (timeline[key]) timeline[key].created++;
      }
      if (item.closed_at && item.closed_at > thirtyDaysAgo) {
        const key = new Date(item.closed_at).toISOString().split('T')[0];
        if (timeline[key]) timeline[key].closed++;
      }
    }

    return { total, open, in_progress, closed, byProject, byType, timeline };
  }

  /**
   * Generate simple bar chart SVG
   * @param {Record<string, number>} data
   * @param {string} color
   */
  function barChart(data, color) {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (entries.length === 0) {
      return html`<div class="muted">${t('dashboard.noData')}</div>`;
    }
    const max = Math.max(...entries.map(e => e[1]), 1);
    const barHeight = 24;
    const chartWidth = 300;
    const labelWidth = 100;
    const height = entries.length * (barHeight + 8);

    return html`
      <svg width="100%" height="${height}" class="dashboard-chart" viewBox="0 0 ${chartWidth} ${height}">
        ${entries.map(([ label, value ], i) => {
          const y = i * (barHeight + 8);
          const barW = ((value / max) * (chartWidth - labelWidth - 40));
          return html`
            <g transform="translate(0, ${y})">
              <text x="0" y="${barHeight / 2 + 4}" fill="var(--fg-secondary)" font-size="11">${label.length > 12 ? label.substring(0, 12) + '...' : label}</text>
              <rect x="${labelWidth}" y="0" width="${barW}" height="${barHeight}" fill="${color}" rx="4" opacity="0.8"/>
              <text x="${labelWidth + barW + 8}" y="${barHeight / 2 + 4}" fill="var(--fg)" font-size="11" font-weight="600">${value}</text>
            </g>
          `;
        })}
      </svg>
    `;
  }

  /**
   * Generate timeline sparkline
   * @param {Record<string, { created: number, closed: number }>} data
   */
  function timelineChart(data) {
    const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
    const maxCreated = Math.max(...entries.map(e => e[1].created), 1);
    const maxClosed = Math.max(...entries.map(e => e[1].closed), 1);
    const max = Math.max(maxCreated, maxClosed);
    const width = 100 / entries.length;
    const height = 80;

    return html`
      <svg width="100%" height="${height}" class="timeline-chart" viewBox="0 0 100 ${height}">
        ${entries.map(([, v], i) => {
          const x = i * width;
          const createdH = (v.created / max) * (height - 10);
          const closedH = (v.closed / max) * (height - 10);
          return html`
            <rect x="${x + 0.5}" y="${height - createdH}" width="${width * 0.4}" height="${createdH}" fill="var(--status-open-base)" opacity="0.7"/>
            <rect x="${x + width * 0.45}" y="${height - closedH}" width="${width * 0.4}" height="${closedH}" fill="var(--status-closed-base)" opacity="0.7"/>
          `;
        })}
      </svg>
      <div class="timeline-legend">
        <span><span class="legend-dot" style="background: var(--status-open-base)"></span> ${t('dashboard.created')}</span>
        <span><span class="legend-dot" style="background: var(--status-closed-base)"></span> ${t('dashboard.closed')}</span>
      </div>
    `;
  }

  function renderView() {
    const stats = computeStats(issues);

    const tpl = html`
      <div class="about-page">
        <section class="about-hero">
          <h1 class="about-hero__title">
            <span class="about-hero__logo">${t('about.hero.title')}</span>
            <span class="about-hero__tagline">${t('about.hero.tagline')}</span>
          </h1>
          <p class="about-hero__subtitle">${t('about.hero.subtitle')}</p>
        </section>

        ${renderSwiper()}

        <section class="about-dashboard">
          <h2 class="about-section-title">${t('about.dashboard')}</h2>
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-card__value">${stats.total}</div>
              <div class="stat-card__label">${t('dashboard.total')}</div>
            </div>
            <div class="stat-card stat-card--open">
              <div class="stat-card__value">${stats.open}</div>
              <div class="stat-card__label">${t('dashboard.open')}</div>
            </div>
            <div class="stat-card stat-card--progress">
              <div class="stat-card__value">${stats.in_progress}</div>
              <div class="stat-card__label">${t('dashboard.inProgress')}</div>
            </div>
            <div class="stat-card stat-card--closed">
              <div class="stat-card__value">${stats.closed}</div>
              <div class="stat-card__label">${t('dashboard.closed')}</div>
            </div>
          </div>
          <div class="dashboard-charts">
            <div class="chart-section">
              <h3 class="chart-title">${t('dashboard.byProject')}</h3>
              ${barChart(stats.byProject, 'var(--accent-cyan)')}
            </div>
            <div class="chart-section">
              <h3 class="chart-title">${t('dashboard.byType')}</h3>
              ${barChart(stats.byType, 'var(--accent-amber)')}
            </div>
          </div>
          <div class="dashboard-timeline">
            <h3 class="chart-title">${t('dashboard.timeline')}</h3>
            ${timelineChart(stats.timeline)}
          </div>
        </section>

        <section class="about-workflow">
          <h2 class="about-section-title">${t('about.workflow')}</h2>

          <div class="workflow-steps">
            <div class="workflow-step">
              <div class="workflow-step__number">1</div>
              <div class="workflow-step__content">
                <h3>${t('workflow.step1.title')}</h3>
                <p>${t('workflow.step1.desc')}</p>
              </div>
            </div>

            <div class="workflow-step">
              <div class="workflow-step__number">2</div>
              <div class="workflow-step__content">
                <h3>${t('workflow.step2.title')}</h3>
                <p>${t('workflow.step2.desc')}</p>
              </div>
            </div>

            <div class="workflow-step">
              <div class="workflow-step__number">3</div>
              <div class="workflow-step__content">
                <h3>${t('workflow.step3.title')}</h3>
                <p>${t('workflow.step3.desc')}</p>
              </div>
            </div>

            <div class="workflow-step">
              <div class="workflow-step__number">4</div>
              <div class="workflow-step__content">
                <h3>${t('workflow.step4.title')}</h3>
                <p>${t('workflow.step4.desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="about-features">
          <h2 class="about-section-title">${t('about.features')}</h2>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-card__icon">[DIR]</div>
              <h3>${t('feature.multiProject.title')}</h3>
              <p>${t('feature.multiProject.desc')}</p>
            </div>

            <div class="feature-card">
              <div class="feature-card__icon">[CMD]</div>
              <h3>${t('feature.instructions.title')}</h3>
              <p>${t('feature.instructions.desc')}</p>
            </div>

            <div class="feature-card">
              <div class="feature-card__icon">[SYN]</div>
              <h3>${t('feature.realtime.title')}</h3>
              <p>${t('feature.realtime.desc')}</p>
            </div>

            <div class="feature-card">
              <div class="feature-card__icon">[BRD]</div>
              <h3>${t('feature.kanban.title')}</h3>
              <p>${t('feature.kanban.desc')}</p>
            </div>
          </div>
        </section>

        <section class="about-cta">
          <a href="#/issues" class="about-cta__button">
            ${t('about.cta')}
          </a>
        </section>
      </div>
    `;
    render(tpl, container);
  }

  /**
   * Fetch issues directly from REST API for dashboard stats
   */
  async function fetchIssuesFromApi() {
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) return [];
      const data = await res.json();
      if (data.ok && Array.isArray(data.issues)) {
        return data.issues;
      }
      return [];
    } catch {
      return [];
    }
  }

  /** @type {((ev: KeyboardEvent) => void) | null} */
  let keyboardHandler = null;

  return {
    async mount() {
      // First render with empty/cached data
      renderView();

      // Fetch issues from REST API (works even when WebSocket subscriptions aren't active)
      const apiIssues = await fetchIssuesFromApi();
      if (apiIssues.length > 0) {
        issues = apiIssues;
        renderView();
      }

      // Also try to get from stores if available
      if (issueStores && issueStores.snapshotFor) {
        try {
          const storeIssues = issueStores.snapshotFor('tab:all-issues') ||
                              issueStores.snapshotFor('tab:issues') ||
                              issueStores.snapshotFor('all-workspaces-issues') || [];
          if (storeIssues.length > 0) {
            issues = storeIssues;
            renderView();
          }
        } catch {
          // ignore
        }
      }

      // Subscribe to updates for live changes
      if (issueStores && issueStores.subscribe) {
        unsubscribe = issueStores.subscribe(() => {
          try {
            if (issueStores.snapshotFor) {
              const updated = issueStores.snapshotFor('tab:all-issues') ||
                              issueStores.snapshotFor('tab:issues') ||
                              issueStores.snapshotFor('all-workspaces-issues') || [];
              if (updated.length > 0) {
                issues = updated;
                renderView();
              }
            }
          } catch {
            // ignore
          }
        });
      }

      // Keyboard navigation for swiper
      keyboardHandler = (ev) => {
        // Only handle when about page is visible and not in an input
        const target = /** @type {HTMLElement} */ (ev.target);
        const tag = target?.tagName?.toLowerCase() || '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        const openIssues = getOpenIssues();
        if (openIssues.length === 0) return;

        if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          handleSwipe('left');
        } else if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          const currentIssue = openIssues[swiperIndex];
          if (currentIssue) {
            handleMarkDone(currentIssue.id);
          }
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          const currentIssue = openIssues[swiperIndex];
          if (currentIssue) {
            openIssueDetail(currentIssue.id);
          }
        }
      };
      document.addEventListener('keydown', keyboardHandler);
    },
    unmount() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (keyboardHandler) {
        document.removeEventListener('keydown', keyboardHandler);
        keyboardHandler = null;
      }
      render(html``, container);
    }
  };
}
