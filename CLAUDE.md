# CLAUDE.md - beads-ui-fork

Fork di beads-ui con funzionalità Notes e Questions per Claude Code.

## Quick Start

```bash
# Sviluppo
npm install
npm start -- --debug

# Accedi
open http://localhost:3000
```

## Architettura

```
server/
├── app.js              # Express app + routes
├── notes-storage.js    # Read/write project-notes.json (NEW)
├── notes-api.js        # REST API per notes (NEW)
├── workspace-state.js  # Shared workspace state (NEW)
├── ws.js               # WebSocket server
└── ...

app/
├── views/
│   ├── notes.js        # Notes view (NEW)
│   ├── questions.js    # Questions view (NEW)
│   ├── list.js         # Issues view
│   ├── epics.js        # Epics view
│   └── board.js        # Board view
├── router.js           # Hash-based routing
├── main.js             # Bootstrap
└── styles.css          # CSS
```

## Storage

File `project-notes.json` nella directory `.beads/` di ogni progetto:

```json
{
  "state_of_art": {
    "content": "Markdown content...",
    "updated_at": "ISO date"
  },
  "questions": [
    {
      "id": "q...",
      "question": "...",
      "answer": "...",
      "category": "roadmap|bugs|architecture|design|testing|general",
      "answered_at": "ISO date"
    }
  ],
  "question_templates": [...]
}
```

## API Endpoints

```
GET    /api/notes              # Full notes object
PUT    /api/notes/state-of-art # Update state of art
GET    /api/notes/questions    # List questions
POST   /api/notes/questions    # Add question
PUT    /api/notes/questions/:id # Update question/answer
DELETE /api/notes/questions/:id # Delete question
GET    /api/notes/templates    # Get question templates
```

## Sviluppo

```bash
# Test syntax
node -e "import('./server/notes-storage.js')"
node -e "import('./app/views/notes.js')"

# Run
npm start -- --debug --open
```

## Dipendenze Chiave

- Express 5.x (HTTP server)
- lit-html (Frontend templating)
- WebSocket (Real-time updates)
