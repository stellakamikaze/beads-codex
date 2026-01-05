<h1 align="center">
  Beads UI Fork
</h1>
<p align="center">
  <b>Fork di beads-ui con Notes e Questions per Claude Code</b><br>
  Dashboard per gestire progetti e guidare lo sviluppo.
</p>

## Nuove Funzionalità

### 📝 Notes View (`#/notes`)
- Editor markdown per documentare lo "stato dell'arte" del progetto
- Auto-save dopo 2 secondi di inattività
- Persistenza in `.beads/project-notes.json`

### ❓ Questions View (`#/questions`)
- Form per domande guidate sullo sviluppo
- Categorie: Roadmap, Bug, Architettura, Design, Testing
- Template predefiniti per domande comuni
- Risposte salvate per essere lette da Claude Code

## Workflow con Claude Code

1. **All'inizio sessione:** Claude Code legge `project-notes.json`
2. **Durante lo sviluppo:** L'utente aggiorna le risposte via web UI
3. **Sincronizzazione:** Il file si sincronizza con git insieme al progetto

## API Endpoints (aggiunti)

```
GET    /api/notes              # Legge notes per workspace corrente
PUT    /api/notes/state-of-art # Aggiorna stato dell'arte
GET    /api/notes/questions    # Lista domande
POST   /api/notes/questions    # Nuova domanda
PUT    /api/notes/questions/:id # Aggiorna risposta
DELETE /api/notes/questions/:id # Elimina domanda
```

---

## Documentazione Originale

<p align="center">
  <b>Local UI for the <code>bd</code> CLI – <a href="https://github.com/steveyegge/beads">Beads</a></b><br>
  Collaborate on issues with your coding agent.
</p>
<div align="center">
  <a href="https://www.npmjs.com/package/beads-ui"><img src="https://img.shields.io/npm/v/beads-ui.svg" alt="npm Version"></a>
  <a href="https://semver.org"><img src="https://img.shields.io/:semver-%E2%9C%93-blue.svg" alt="SemVer"></a>
  <a href="https://github.com/mantoni/beads-ui/actions/worflows/ci.yml"><img src="https://github.com/mantoni/eslint_d.js/actions/workflows/ci.yml/badge.svg" alt="Build Status"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/npm/l/eslint_d.svg" alt="MIT License"></a>
  <br>
  <br>
</div>

## Features

- ✨ **Zero setup** – just run `bdui start`
- 📺 **Live updates** – Monitors the beads database for changes
- 🔎 **Issues view** – Filter and search issues, edit inline
- ⛰️ **Epics view** – Show progress per epic, expand rows, edit inline
- 🏂 **Board view** – Blocked / Ready / In progress / Closed columns
- ⌨️ **Keyboard navigation** – Navigate and edit without touching the mouse

## Setup

```sh
npm i beads-ui -g
# In your project directory:
bdui start --open
```

See `bdui --help` for options.

## Screenshots

**Issues**

![Issues view](https://github.com/mantoni/beads-ui/raw/main/media/bdui-issues.png)

**Epics**

![Epics view](https://github.com/mantoni/beads-ui/raw/main/media/bdui-epics.png)

**Board**

![Board view](https://github.com/mantoni/beads-ui/raw/main/media/bdui-board.png)

## Environment variables

- `BD_BIN`: path to the `bd` binary.
- `BDUI_RUNTIME_DIR`: override runtime directory for PID/logs. Defaults to
  `$XDG_RUNTIME_DIR/beads-ui` or the system temp dir.
- `HOST`: overrides the bind address (default `127.0.0.1`).
- `PORT`: overrides the listen port (default `3000`).

These can also be set via CLI options: `bdui start --host 0.0.0.0 --port 8080`

## Platform notes

- macOS/Linux are fully supported. On Windows, the CLI uses `cmd /c start` to
  open URLs and relies on Node’s `process.kill` semantics for stopping the
  daemon.

## Developer Workflow

- 🔨 Clone the repo and run `npm install`.
- 🚀 Start the dev server with `npm start`.
- 🔗 Alternatively, use `npm link` to link the package globally and run
  `bdui start` from any project.

## Debug Logging

- The codebase uses the `debug` package with namespaces like `beads-ui:*`.
- Enable logs in the browser by running in DevTools:
  - `localStorage.debug = 'beads-ui:*'` then reload the page
- Enable logs for Node/CLI (server, build scripts) by setting `DEBUG`:
  - `DEBUG=beads-ui:* bdui start`
  - `DEBUG=beads-ui:* node scripts/build-frontend.js`

## License

MIT
