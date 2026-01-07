import { html, render } from 'lit-html';

/**
 * About/Landing page explaining how Codex works
 * @param {HTMLElement} container
 */
export function createAboutView(container) {
  function renderView() {
    const tpl = html`
      <div class="about-page">
        <section class="about-hero">
          <h1 class="about-hero__title">
            <span class="about-hero__logo">Codex</span>
            <span class="about-hero__tagline">AI-Powered Issue Management</span>
          </h1>
          <p class="about-hero__subtitle">
            Un hub centralizzato per gestire issues multi-progetto dove i commenti
            diventano <strong>istruzioni</strong> per Claude Code.
          </p>
        </section>

        <section class="about-workflow">
          <h2 class="about-section-title">Come Funziona</h2>

          <div class="workflow-steps">
            <div class="workflow-step">
              <div class="workflow-step__number">1</div>
              <div class="workflow-step__content">
                <h3>Crea Issue</h3>
                <p>Descrivi cosa vuoi realizzare in linguaggio naturale.
                   Non serve essere tecnici - scrivi come parleresti a un collega.</p>
              </div>
            </div>

            <div class="workflow-step">
              <div class="workflow-step__number">2</div>
              <div class="workflow-step__content">
                <h3>Aggiungi Istruzioni</h3>
                <p>Usa i commenti per dare istruzioni specifiche.
                   Marca il commento come <span class="code-inline">> INSTRUCTION</span>
                   per indicare che è un comando per Claude Code.</p>
              </div>
            </div>

            <div class="workflow-step">
              <div class="workflow-step__number">3</div>
              <div class="workflow-step__content">
                <h3>Claude Code Esegue</h3>
                <p>Claude Code sincronizza le issue e vede le nuove istruzioni.
                   Esegue i task automaticamente e aggiorna lo stato.</p>
              </div>
            </div>

            <div class="workflow-step">
              <div class="workflow-step__number">4</div>
              <div class="workflow-step__content">
                <h3>Monitora il Progresso</h3>
                <p>Visualizza lo stato di tutte le issue nella Board.
                   Ogni progetto è raggruppato per una visione d'insieme.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="about-features">
          <h2 class="about-section-title">Caratteristiche Principali</h2>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-card__icon">📁</div>
              <h3>Multi-Progetto</h3>
              <p>Gestisci issue da più progetti in un'unica interfaccia.
                 Le issue sono raggruppate per workspace.</p>
            </div>

            <div class="feature-card">
              <div class="feature-card__icon">💬</div>
              <h3>Commenti come Istruzioni</h3>
              <p>I commenti marcati come "istruzione" diventano comandi
                 che Claude Code può eseguire.</p>
            </div>

            <div class="feature-card">
              <div class="feature-card__icon">🔄</div>
              <h3>Sync Real-time</h3>
              <p>Sincronizzazione WebSocket in tempo reale tra
                 Codex e Claude Code.</p>
            </div>

            <div class="feature-card">
              <div class="feature-card__icon">📋</div>
              <h3>Board Kanban</h3>
              <p>Visualizza il flusso di lavoro con colonne
                 Open, In Progress e Closed.</p>
            </div>
          </div>
        </section>

        <section class="about-cta">
          <a href="#/issues" class="about-cta__button">
            Inizia con le Issues →
          </a>
        </section>
      </div>
    `;
    render(tpl, container);
  }

  return {
    mount() {
      renderView();
    },
    unmount() {
      render(html``, container);
    }
  };
}
