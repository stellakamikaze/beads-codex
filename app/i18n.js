/**
 * i18n - Internationalization support for Codex
 * Supports: English (en), Italian (it)
 */

/** @type {Record<string, Record<string, string>>} */
const translations = {
  en: {
    // Navigation
    'nav.about': 'About',
    'nav.issues': 'Issues',
    'nav.epics': 'Epics',
    'nav.board': 'Board',

    // Header
    'header.newIssue': 'New Issue',
    'header.darkMode': 'Dark',
    'header.loading': 'Loading',

    // About page
    'about.hero.title': 'Codex',
    'about.hero.tagline': 'AI-Powered Issue Management',
    'about.hero.subtitle': 'A centralized hub for managing multi-project issues where comments become instructions for Claude Code.',
    'about.dashboard': 'Dashboard',
    'about.workflow': 'How It Works',
    'about.features': 'Key Features',
    'about.cta': 'Start with Issues →',

    // Dashboard stats
    'dashboard.total': 'Total Issues',
    'dashboard.open': 'Open',
    'dashboard.inProgress': 'In Progress',
    'dashboard.closed': 'Closed',
    'dashboard.byProject': 'By Project',
    'dashboard.byType': 'By Type',
    'dashboard.timeline': 'Activity Last 30 Days',
    'dashboard.noData': 'No data',
    'dashboard.created': 'Created',

    // Workflow steps
    'workflow.step1.title': 'Create Issue',
    'workflow.step1.desc': 'Describe what you want to accomplish in natural language. No need to be technical - write as if talking to a colleague.',
    'workflow.step2.title': 'Add Instructions',
    'workflow.step2.desc': 'Use comments to give specific instructions. Mark the comment as an instruction for Claude Code.',
    'workflow.step3.title': 'Claude Code Executes',
    'workflow.step3.desc': 'Claude Code syncs issues and sees new instructions. It executes tasks automatically and updates the status.',
    'workflow.step4.title': 'Monitor Progress',
    'workflow.step4.desc': 'View the status of all issues in the Board. Each project is grouped for an overview.',

    // Features
    'feature.multiProject.title': 'Multi-Project',
    'feature.multiProject.desc': 'Manage issues from multiple projects in a single interface. Issues are grouped by workspace.',
    'feature.instructions.title': 'Comments as Instructions',
    'feature.instructions.desc': 'Comments become commands that Claude Code can execute.',
    'feature.realtime.title': 'Real-time Sync',
    'feature.realtime.desc': 'WebSocket synchronization in real-time between Codex and Claude Code.',
    'feature.kanban.title': 'Kanban Board',
    'feature.kanban.desc': 'Visualize workflow with Open, In Progress, and Closed columns.',

    // Issues list
    'issues.title': 'Issues',
    'issues.filterStatus': 'Status',
    'issues.filterType': 'Type',
    'issues.filterProject': 'Project',
    'issues.noResults': 'No issues found',
    'issues.created': 'Created',

    // Issue detail
    'detail.description': 'Description',
    'detail.acceptanceCriteria': 'Acceptance Criteria',
    'detail.notes': 'Notes',
    'detail.design': 'Design',
    'detail.comments': 'Comments',
    'detail.addComment': 'Add Comment',
    'detail.sendInstruction': 'Send Instruction',
    'detail.instructionHint': 'All comments are instructions for Claude Code',
    'detail.noComments': 'No comments yet',
    'detail.placeholder.description': 'Describe the goal in natural language. E.g.: "I want the user to be able to search products by name and filter by category"',
    'detail.placeholder.criteria': 'Criteria to consider the task complete. E.g.:\n- [ ] The search form accepts text input\n- [ ] Results update in real-time',
    'detail.placeholder.notes': 'Technical notes, links, references. E.g.:\n- See API docs: /docs/api.md\n- Use the existing UserService',
    'detail.placeholder.design': 'ASCII diagrams, mockups, visual structure. E.g.:\n┌─────────────────┐\n│  Search Input   │\n├─────────────────┤\n│  Results List   │\n└─────────────────┘',

    // Epics
    'epics.title': 'Epics',
    'epics.intro': 'Epics in the Beads system are high-level issues that group related tasks. Each Epic tracks overall progress showing how many child tasks have been completed.',
    'epics.usage': 'Use Epics to organize complex features that require multiple implementation steps.',
    'epics.noEpics': 'No epics found',

    // Board
    'board.ready': 'Ready',
    'board.inProgress': 'In Progress',
    'board.closed': 'Closed',
    'board.blocked': 'Blocked',

    // New issue dialog
    'newIssue.title': 'Create New Issue',
    'newIssue.titleLabel': 'Title',
    'newIssue.typeLabel': 'Type',
    'newIssue.descLabel': 'Description',
    'newIssue.create': 'Create',
    'newIssue.cancel': 'Cancel',

    // Status
    'status.open': 'Open',
    'status.in_progress': 'In Progress',
    'status.closed': 'Closed',
    'status.blocked': 'Blocked',

    // Types
    'type.task': 'Task',
    'type.bug': 'Bug',
    'type.feature': 'Feature',
    'type.epic': 'Epic',
    'type.chore': 'Chore',

    // General
    'general.save': 'Save',
    'general.cancel': 'Cancel',
    'general.delete': 'Delete',
    'general.edit': 'Edit',
    'general.close': 'Close',
    'general.loading': 'Loading...',
    'general.error': 'Error',
  },

  it: {
    // Navigation
    'nav.about': 'Info',
    'nav.issues': 'Issues',
    'nav.epics': 'Epics',
    'nav.board': 'Board',

    // Header
    'header.newIssue': 'Nuova Issue',
    'header.darkMode': 'Scuro',
    'header.loading': 'Caricamento',

    // About page
    'about.hero.title': 'Codex',
    'about.hero.tagline': 'Gestione Issue con AI',
    'about.hero.subtitle': 'Un hub centralizzato per gestire issues multi-progetto dove i commenti diventano istruzioni per Claude Code.',
    'about.dashboard': 'Dashboard',
    'about.workflow': 'Come Funziona',
    'about.features': 'Caratteristiche Principali',
    'about.cta': 'Inizia con le Issues →',

    // Dashboard stats
    'dashboard.total': 'Issue Totali',
    'dashboard.open': 'Aperte',
    'dashboard.inProgress': 'In Corso',
    'dashboard.closed': 'Chiuse',
    'dashboard.byProject': 'Per Progetto',
    'dashboard.byType': 'Per Tipo',
    'dashboard.timeline': 'Attività Ultimi 30 Giorni',
    'dashboard.noData': 'Nessun dato',
    'dashboard.created': 'Create',

    // Workflow steps
    'workflow.step1.title': 'Crea Issue',
    'workflow.step1.desc': 'Descrivi cosa vuoi realizzare in linguaggio naturale. Non serve essere tecnici - scrivi come parleresti a un collega.',
    'workflow.step2.title': 'Aggiungi Istruzioni',
    'workflow.step2.desc': 'Usa i commenti per dare istruzioni specifiche. I commenti sono comandi per Claude Code.',
    'workflow.step3.title': 'Claude Code Esegue',
    'workflow.step3.desc': 'Claude Code sincronizza le issue e vede le nuove istruzioni. Esegue i task automaticamente e aggiorna lo stato.',
    'workflow.step4.title': 'Monitora il Progresso',
    'workflow.step4.desc': 'Visualizza lo stato di tutte le issue nella Board. Ogni progetto è raggruppato per una visione d\'insieme.',

    // Features
    'feature.multiProject.title': 'Multi-Progetto',
    'feature.multiProject.desc': 'Gestisci issue da più progetti in un\'unica interfaccia. Le issue sono raggruppate per workspace.',
    'feature.instructions.title': 'Commenti come Istruzioni',
    'feature.instructions.desc': 'I commenti diventano comandi che Claude Code può eseguire.',
    'feature.realtime.title': 'Sync Real-time',
    'feature.realtime.desc': 'Sincronizzazione WebSocket in tempo reale tra Codex e Claude Code.',
    'feature.kanban.title': 'Board Kanban',
    'feature.kanban.desc': 'Visualizza il flusso di lavoro con colonne Aperte, In Corso e Chiuse.',

    // Issues list
    'issues.title': 'Issues',
    'issues.filterStatus': 'Stato',
    'issues.filterType': 'Tipo',
    'issues.filterProject': 'Progetto',
    'issues.noResults': 'Nessuna issue trovata',
    'issues.created': 'Creata',

    // Issue detail
    'detail.description': 'Descrizione',
    'detail.acceptanceCriteria': 'Criteri di Accettazione',
    'detail.notes': 'Note',
    'detail.design': 'Design',
    'detail.comments': 'Commenti',
    'detail.addComment': 'Aggiungi Commento',
    'detail.sendInstruction': 'Invia Istruzione',
    'detail.instructionHint': 'Tutti i commenti sono istruzioni per Claude Code',
    'detail.noComments': 'Nessun commento',
    'detail.placeholder.description': 'Descrivi l\'obiettivo in linguaggio naturale. Es: "Voglio che l\'utente possa cercare prodotti per nome e filtrare per categoria"',
    'detail.placeholder.criteria': 'Criteri per considerare il task completato. Es:\n- [ ] Il form di ricerca accetta input testuale\n- [ ] I risultati si aggiornano in tempo reale',
    'detail.placeholder.notes': 'Note tecniche, link, riferimenti. Es:\n- Vedi documentazione API: /docs/api.md\n- Usa il servizio UserService esistente',
    'detail.placeholder.design': 'Diagrammi ASCII, mockup, struttura visiva. Es:\n┌─────────────────┐\n│  Campo Ricerca  │\n├─────────────────┤\n│  Lista Risultati│\n└─────────────────┘',

    // Epics
    'epics.title': 'Epics',
    'epics.intro': 'Gli Epic nel sistema Beads sono issue di alto livello che raggruppano task correlati. Ogni Epic traccia il progresso complessivo mostrando quanti task figli sono stati completati.',
    'epics.usage': 'Usa gli Epic per organizzare funzionalità complesse che richiedono più step di implementazione.',
    'epics.noEpics': 'Nessun epic trovato',

    // Board
    'board.ready': 'Pronti',
    'board.inProgress': 'In Corso',
    'board.closed': 'Chiusi',
    'board.blocked': 'Bloccati',

    // New issue dialog
    'newIssue.title': 'Crea Nuova Issue',
    'newIssue.titleLabel': 'Titolo',
    'newIssue.typeLabel': 'Tipo',
    'newIssue.descLabel': 'Descrizione',
    'newIssue.create': 'Crea',
    'newIssue.cancel': 'Annulla',

    // Status
    'status.open': 'Aperta',
    'status.in_progress': 'In Corso',
    'status.closed': 'Chiusa',
    'status.blocked': 'Bloccata',

    // Types
    'type.task': 'Task',
    'type.bug': 'Bug',
    'type.feature': 'Feature',
    'type.epic': 'Epic',
    'type.chore': 'Chore',

    // General
    'general.save': 'Salva',
    'general.cancel': 'Annulla',
    'general.delete': 'Elimina',
    'general.edit': 'Modifica',
    'general.close': 'Chiudi',
    'general.loading': 'Caricamento...',
    'general.error': 'Errore',
  }
};

/** @type {string} */
let currentLocale = 'it'; // Default to Italian

/** @type {Set<() => void>} */
const listeners = new Set();

/**
 * Get a translation string
 * @param {string} key
 * @param {Record<string, string>} [params]
 * @returns {string}
 */
export function t(key, params) {
  const dict = translations[currentLocale] || translations['en'];
  let str = dict[key] || translations['en'][key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }

  return str;
}

/**
 * Get current locale
 * @returns {string}
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Set locale and notify listeners
 * @param {string} locale
 */
export function setLocale(locale) {
  if (translations[locale] && locale !== currentLocale) {
    currentLocale = locale;
    localStorage.setItem('codex-locale', locale);
    listeners.forEach(fn => fn());
  }
}

/**
 * Subscribe to locale changes
 * @param {() => void} fn
 * @returns {() => void}
 */
export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Initialize locale from localStorage or browser settings
 */
export function initLocale() {
  const saved = localStorage.getItem('codex-locale');
  if (saved && translations[saved]) {
    currentLocale = saved;
  } else {
    // Try browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      currentLocale = browserLang;
    }
  }
}

/**
 * Get available locales
 * @returns {Array<{ code: string, name: string }>}
 */
export function getAvailableLocales() {
  return [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italiano' }
  ];
}
