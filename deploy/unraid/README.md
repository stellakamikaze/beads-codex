# Codex Stack per Unraid

Deploy completo di Codex + Claude Code su Unraid per gestione issue AI-driven.

## Architettura

```
┌─────────────────────────────────────────────────────────────────┐
│                         UNRAID SERVER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │    Codex     │   │ Claude Code  │   │    Unraid MCP        ││
│  │   (Docker)   │◄──│   (Docker)   │──►│     Server           ││
│  │   Port 3000  │   │  Interactive │   │   Port 3001          ││
│  │              │   │              │   │                      ││
│  │  Issue Hub   │   │  Legge issue │   │  26 tools per:       ││
│  │  + API REST  │   │  + istruzioni│   │  - Docker mgmt       ││
│  └──────────────┘   └──────────────┘   └──────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Requisiti

- Unraid 6.x+
- Docker Compose Manager plugin
- Tailscale (raccomandato per accesso remoto)
- Claude Code MAX subscription sul tuo PC

## Installazione Rapida

### 1. Prepara directory su Unraid

```bash
ssh root@unraid
mkdir -p /mnt/user/appdata/codex-stack/scripts
mkdir -p /mnt/user/appdata/claude-code/config
mkdir -p /mnt/user/appdata/claude-code/ssh
mkdir -p /mnt/user/appdata/projects
```

### 2. Copia i file

```bash
# Da questo repository
scp docker-compose.yml root@unraid:/mnt/user/appdata/codex-stack/
scp .env.example root@unraid:/mnt/user/appdata/codex-stack/.env
scp codex-client.sh root@unraid:/mnt/user/appdata/codex-stack/scripts/
```

### 3. Genera token Codex

```bash
ssh root@unraid
cd /mnt/user/appdata/codex-stack
TOKEN=$(openssl rand -hex 32)
sed -i "s/CODEX_TOKEN=/CODEX_TOKEN=$TOKEN/" .env
echo "Token: $TOKEN"
```

**Salva questo token** - ti servirà per configurare Claude Code sul tuo PC.

### 4. Copia credenziali Claude MAX

Dal tuo PC Windows:
```powershell
xcopy %USERPROFILE%\.claude\* \\unraid\appdata\claude-code\config\ /E
```

Da Mac/Linux:
```bash
scp -r ~/.claude/* root@unraid:/mnt/user/appdata/claude-code/config/
```

### 5. Avvia lo stack

In Unraid Docker Compose Manager:
1. Add New Stack → Codex
2. Punta a `/mnt/user/appdata/codex-stack/docker-compose.yml`
3. Compose Up

Oppure via CLI:
```bash
cd /mnt/user/appdata/codex-stack
docker-compose up -d
```

## Accesso

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| Codex UI | http://unraid:3000 | Interfaccia web issue |
| Codex API | http://unraid:3000/api | REST API |
| Unraid MCP | http://unraid:3001 | MCP per Claude Code |

## Utilizzo

### Accedi a Claude Code

```bash
# Via SSH
ssh root@unraid
docker exec -it claude-code cc

# Oppure direttamente
ssh root@unraid docker exec -it claude-code cc
```

### Comandi Codex

```bash
# Dentro il container claude-code
codex pending         # Issue con istruzioni pendenti
codex issues          # Lista tutte le issue
codex show UI-123     # Dettaglio issue
codex complete UI-123 "Task completato"  # Marca come fatto
```

### Workflow tipico

1. **Apri Codex** nel browser → http://unraid:3000
2. **Crea/seleziona issue** e aggiungi istruzione
3. **Connetti a Claude Code**: `docker exec -it claude-code cc`
4. **Claude Code** vede le istruzioni pendenti all'avvio
5. **Esegui il task** e marca come completato

## Configurazione Claude Code

Claude Code nel container ha accesso a:

| Path Container | Path Unraid | Descrizione |
|----------------|-------------|-------------|
| `/workspace` | `/mnt/user/appdata/projects` | I tuoi progetti |
| `/root/.claude` | `/mnt/user/appdata/claude-code/config` | Credenziali MAX |
| `/var/run/docker.sock` | Docker socket | Gestione container |

### MCP Servers disponibili

Il container include:
- **filesystem**: accesso ai file in `/workspace`
- **unraid**: gestione Unraid (container, VM, storage)

## Configura PC locale

Per usare Codex dal tuo PC con Claude Code locale:

```bash
# ~/.bashrc o ~/.zshrc
export CODEX_URL="http://unraid.local:3000"  # o via Tailscale
export CODEX_TOKEN="il-tuo-token"
```

## Troubleshooting

### Claude Code non si autentica

1. Verifica che le credenziali siano copiate:
   ```bash
   ls -la /mnt/user/appdata/claude-code/config/
   # Deve contenere credentials.json
   ```

2. Se mancano, ricopia dal tuo PC dopo aver fatto `claude login`

### Codex non risponde

```bash
docker logs codex
docker-compose restart codex
```

### Container non comunicano

```bash
docker network inspect codex-network
# Tutti i container devono essere nella stessa rete
```

## Aggiornamenti

```bash
cd /mnt/user/appdata/codex-stack
docker-compose pull
docker-compose up -d
```

## Backup

Directory da backuppare:
- `/mnt/user/appdata/codex-stack/` - configurazione
- `/mnt/user/appdata/claude-code/` - credenziali
- `/mnt/user/appdata/projects/` - i tuoi progetti
- Volume `codex-data` - database issue
