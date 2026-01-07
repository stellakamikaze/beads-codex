# CLAUDE.md - Codex

Hub centralizzato per gestire issues multi-progetto dove i commenti diventano istruzioni per Claude Code.

## Workflow

1. Apri Codex → vedi issues raggruppate per progetto
2. Apri issue → leggi body (spiegazione non-tecnica)
3. Aggiungi commento marcato come "istruzione"
4. Claude Code sync → vede issues con istruzioni pronte ed esegue

## Quick Start

```bash
# Sviluppo locale
npm install
npm start -- --debug --open

# Docker
docker compose up -d
```

## REST API per Claude Code

Codex espone una REST API per permettere a istanze Claude Code di:
- Leggere issues e istruzioni pendenti
- Aggiornare stato delle issues
- Aggiungere commenti con risultati

### Autenticazione

```bash
# Via header
curl -H "Authorization: Bearer $CODEX_TOKEN" $CODEX_URL/api/issues

# Via query param
curl "$CODEX_URL/api/issues?token=$CODEX_TOKEN"
```

Se `CODEX_TOKEN` non è configurato, l'API è aperta (development mode).

### Endpoints

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/issues` | Lista tutte le issues |
| GET | `/api/issues?status=open` | Filtra per status |
| GET | `/api/issues/pending` | Issues con istruzioni pendenti |
| GET | `/api/issues/:id` | Dettaglio issue + commenti |
| PUT | `/api/issues/:id/status` | Aggiorna status |
| POST | `/api/issues/:id/comments` | Aggiungi commento |
| POST | `/api/issues/:id/complete` | Marca istruzione completata |
| POST | `/api/issues` | Crea nuova issue |

### Esempio: Check Istruzioni Pendenti

```bash
# Lista issues con istruzioni non completate
curl -s "$CODEX_URL/api/issues/pending" | jq '.issues[] | {id, title, pending: .pending_count}'
```

Response:
```json
{
  "ok": true,
  "issues": [{
    "id": "UI-k7eb",
    "title": "Implementa feature X",
    "status": "open",
    "pending_instructions": [{
      "text": "Aggiungi validazione email al form",
      "is_instruction": true
    }],
    "pending_count": 1
  }],
  "count": 1,
  "total_pending": 1
}
```

### Esempio: Completa Istruzione

```bash
# Dopo aver eseguito l'istruzione
curl -X POST "$CODEX_URL/api/issues/UI-k7eb/complete" \
  -H "Content-Type: application/json" \
  -d '{"result": "Validazione email implementata in form.js", "author": "Claude Code"}'
```

## Client Script

Usa `scripts/codex-client.sh` per interagire con Codex:

```bash
export CODEX_URL="http://codex.tailnet:3000"
export CODEX_TOKEN="your-token"

# Check istruzioni pendenti
./scripts/codex-client.sh pending

# Lista issues
./scripts/codex-client.sh issues open

# Dettaglio issue
./scripts/codex-client.sh show UI-k7eb

# Aggiorna status
./scripts/codex-client.sh status UI-k7eb in_progress

# Aggiungi commento
./scripts/codex-client.sh comment UI-k7eb "Inizio lavoro su questa issue"

# Marca completata
./scripts/codex-client.sh complete UI-k7eb "Feature implementata, test passati"
```

## Setup Multi-PC con Tailscale

### 1. Codex su Server (Unraid/NAS)

```bash
# .env
CODEX_TOKEN=$(openssl rand -hex 32)

# docker-compose.yml già configurato
docker compose up -d
```

### 2. Claude Code su Desktop/Laptop

Aggiungi al tuo `~/.bashrc` o `~/.zshrc`:

```bash
export CODEX_URL="http://codex.tailnet:3000"  # Via Tailscale
export CODEX_TOKEN="your-token-here"
```

Oppure crea un hook Claude Code per check automatico:

```bash
# ~/.claude/hooks/session-start.sh
#!/bin/bash
pending=$(curl -s -H "Authorization: Bearer $CODEX_TOKEN" \
  "$CODEX_URL/api/issues/pending" | jq -r '.count')
if [ "$pending" != "0" ]; then
  echo "⚠️  $pending issue(s) con istruzioni pendenti su Codex"
fi
```

## Architettura

```
server/
├── app.js              # Express app + routes
├── api.js              # REST API per Claude Code
├── ws.js               # WebSocket server
├── bd.js               # Wrapper per bd CLI
├── list-adapters.js    # Normalizzazione issues
└── sync-api.js         # Sync tra workspace

app/
├── views/
│   ├── about.js        # Landing page
│   ├── list.js         # Issues list
│   ├── detail.js       # Issue detail + commenti
│   ├── board.js        # Kanban board
│   └── nav.js          # Navigation
├── router.js           # Hash-based routing
├── main.js             # Bootstrap
└── styles.css          # CSS (Command Center theme)

scripts/
└── codex-client.sh     # CLI client per Claude Code
```

## Commenti con Istruzioni

I commenti marcati come "istruzione" sono salvati con prefisso `[ISTRUZIONE] `:

```javascript
// Payload add-comment
{
  id: 'UI-123',
  text: 'Implementa la validazione email',
  is_instruction: true
}
// Salvato come: "[ISTRUZIONE] Implementa la validazione email"
```

I completamenti sono salvati con prefisso `[COMPLETATO] `:

```javascript
// Payload complete
{
  id: 'UI-123',
  result: 'Validazione implementata in form.js'
}
// Salvato come: "[COMPLETATO] Validazione implementata in form.js"
```

## WebSocket Handlers (per UI)

| Type | Payload | Descrizione |
|------|---------|-------------|
| `subscribe-list` | `{ id, type, params }` | Sottoscrivi a lista |
| `update-status` | `{ id, status }` | Cambia status |
| `edit-text` | `{ id, field, value }` | Modifica campo |
| `get-comments` | `{ id }` | Lista commenti |
| `add-comment` | `{ id, text, is_instruction? }` | Aggiungi commento |
| `create-issue` | `{ title, type?, description? }` | Crea issue |
| `delete-issue` | `{ id }` | Elimina issue |

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

## Docker

```bash
# Build e run
docker compose up -d

# Logs
docker compose logs -f

# Genera token
openssl rand -hex 32
```

## Dipendenze

- Express 5.x (HTTP server)
- lit-html (Frontend templating)
- WebSocket (Real-time updates)
- bd CLI (beads issue management)
