# beads-ui-fork - Piano Implementazione

## Feature Richieste

1. **Stato dell'Arte** - Documentazione discorsiva per ogni progetto
2. **Domande Sviluppo** - Form con domande guidate + campi risposta
3. **Persistenza** - Note/risposte salvate accanto al db beads
4. **Multi-progetto** - Switch tra workspace (già supportato)

## Architettura

### Storage

File `project-notes.json` nella directory `.beads/` di ogni progetto:

```json
{
  "state_of_art": {
    "content": "Testo markdown dello stato dell'arte...",
    "updated_at": "2026-01-05T17:00:00Z"
  },
  "questions": [
    {
      "id": "q1",
      "question": "Quale architettura per il sistema di autenticazione?",
      "answer": "OAuth2 con Google...",
      "category": "architecture",
      "answered_at": "2026-01-05T17:00:00Z"
    }
  ],
  "question_templates": [
    {
      "id": "t1",
      "question": "Qual è la prossima feature da implementare?",
      "category": "roadmap"
    }
  ]
}
```

### API Endpoints (Server)

```
GET  /api/notes                    # Get notes for current workspace
PUT  /api/notes/state-of-art       # Update state of art
POST /api/notes/questions          # Add question
PUT  /api/notes/questions/:id      # Answer/update question
DELETE /api/notes/questions/:id    # Remove question
GET  /api/notes/templates          # Get question templates
```

### Frontend Views

1. **Notes view** (`#/notes`)
   - Editor markdown per stato dell'arte
   - Preview rendered
   - Auto-save

2. **Questions view** (`#/questions`)
   - Lista domande con form risposta
   - Filtro per categoria
   - Add new question

### File da Modificare/Creare

#### Server
- `server/notes-storage.js` (NEW) - Read/write project-notes.json
- `server/notes-api.js` (NEW) - API routes
- `server/app.js` - Mount notes routes

#### Frontend
- `app/views/notes.js` (NEW) - Notes editor view
- `app/views/questions.js` (NEW) - Questions list view
- `app/views/nav.js` - Add Notes/Questions tabs
- `app/router.js` - Add routes
- `app/main.js` - Wire up new views
- `app/styles.css` - Styles for new components

## Design UI

### Notes View
```
┌─────────────────────────────────────────────────────────────┐
│ [Issues] [Epics] [Board] [Notes] [Questions]    [sigonella ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STATO DELL'ARTE                            [Edit] [Preview] │
│  ━━━━━━━━━━━━━━━━━                                          │
│                                                              │
│  Sigonella è un task manager basato sulla Matrice di        │
│  Eisenhower, sviluppato per Ufficio Furore...               │
│                                                              │
│  ## Stack                                                    │
│  - Backend: FastAPI + SQLAlchemy                            │
│  - Frontend: Vue.js + Vuetify (in migrazione)               │
│                                                              │
│  ## Funzionalità Implementate                               │
│  - Sync Google Tasks                                         │
│  - Quadranti Eisenhower                                      │
│  ...                                                         │
│                                                              │
│                                        Last updated: 5 min ago│
└─────────────────────────────────────────────────────────────┘
```

### Questions View
```
┌─────────────────────────────────────────────────────────────┐
│ [Issues] [Epics] [Board] [Notes] [Questions]    [sigonella ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DOMANDE PER LO SVILUPPO                         [+ Nuova]  │
│  ━━━━━━━━━━━━━━━━━━━━━━                                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🏗️ Architecture                                         │ │
│  │                                                         │ │
│  │ Q: Quale pattern per la gestione dello stato?          │ │
│  │ ┌─────────────────────────────────────────────────┐   │ │
│  │ │ Pinia store con moduli separati per tasks,      │   │ │
│  │ │ tags, e UI state...                              │   │ │
│  │ └─────────────────────────────────────────────────┘   │ │
│  │                                          [Save] [Clear]│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🎯 Roadmap                                              │ │
│  │                                                         │ │
│  │ Q: Qual è la prossima feature prioritaria?             │ │
│  │ ┌─────────────────────────────────────────────────┐   │ │
│  │ │ [textarea for answer]                            │   │ │
│  │ └─────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Fasi Implementazione

### Fase 1: Backend Storage + API
1. [x] Clone repo
2. [ ] Creare `notes-storage.js`
3. [ ] Creare `notes-api.js`
4. [ ] Aggiungere routes in `app.js`
5. [ ] Testare con curl

### Fase 2: Frontend Notes View
1. [ ] Creare `views/notes.js`
2. [ ] Aggiungere tab in `nav.js`
3. [ ] Aggiungere route in `router.js`
4. [ ] Aggiungere styles

### Fase 3: Frontend Questions View
1. [ ] Creare `views/questions.js`
2. [ ] Aggiungere tab
3. [ ] Form components
4. [ ] Category filtering

### Fase 4: Polish
1. [ ] Auto-save
2. [ ] Keyboard shortcuts
3. [ ] Mobile responsive
4. [ ] Documentation
