# CLAUDE.md - beads-codex

Hub semplificato per gestire issues multi-progetto dove i commenti diventano istruzioni per Claude Code.

## Workflow

1. Apri Codex → vedi issues raggruppate per progetto
2. Apri issue → leggi body (spiegazione non-tecnica)
3. Aggiungi commento marcato come "istruzione"
4. Claude Code sync → vede issues con istruzioni pronte

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
├── ws.js               # WebSocket server (handlers per issues/comments)
├── bd.js               # Wrapper per bd CLI
├── list-adapters.js    # Normalizzazione issues + project name
├── subscriptions.js    # Real-time subscriptions
└── sync-api.js         # Sync con workspace

app/
├── views/
│   ├── list.js         # Issues view (raggruppate per progetto)
│   ├── issue-row.js    # Riga singola issue
│   ├── detail.js       # Dettaglio issue + commenti
│   ├── epics.js        # Epics view
│   ├── board.js        # Kanban board
│   └── nav.js          # Navigation tabs
├── router.js           # Hash-based routing
├── main.js             # Bootstrap
├── protocol.js         # WebSocket protocol types
└── styles.css          # CSS
```

## Commenti con Istruzioni

I commenti possono essere marcati come "istruzione" per Claude Code:

```javascript
// Payload add-comment
{
  id: 'UI-123',
  text: 'Implementa la validazione email',
  is_instruction: true  // Flag per Claude Code
}
```

Internamente salvato con prefisso `[ISTRUZIONE] ` nel testo.

## WebSocket Handlers

| Type | Payload | Descrizione |
|------|---------|-------------|
| `list-issues` | `{ filters }` | Lista issues |
| `get-issue` | `{ id }` | Dettaglio singola issue |
| `update-status` | `{ id, status }` | Cambia status |
| `edit-text` | `{ id, field, value }` | Modifica campo testuale |
| `get-comments` | `{ id }` | Lista commenti issue |
| `add-comment` | `{ id, text, is_instruction? }` | Aggiungi commento |
| `create-issue` | `{ title, type?, description? }` | Crea issue |
| `dep-add/remove` | `{ a, b }` | Gestione dipendenze |
| `label-add/remove` | `{ id, label }` | Gestione label |
| `delete-issue` | `{ id }` | Elimina issue |

## Multi-Progetto

Le issues vengono raggruppate per `project` derivato dal workspace path:

```javascript
// In list-adapters.js
function deriveProjectName(workspace_path) {
  return path.basename(path.resolve(workspace_path)) || '';
}
```

La list view mostra header di sezione per ogni progetto.

## Sviluppo

```bash
# Test
npm test

# Syntax check
node --check server/app.js
node --check app/main.js

# Run con debug
npm start -- --debug --open
```

## Campi Rimossi (vs beads-ui originale)

- Priority (0-4)
- Assignee
- Chat view
- Questions view
- Notes view
- Authentication

I dati restano nel DB beads, solo la UI non li mostra.

## Dipendenze Chiave

- Express 5.x (HTTP server)
- lit-html (Frontend templating)
- WebSocket (Real-time updates)
- bd CLI (beads issue management)
