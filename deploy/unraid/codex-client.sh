#!/bin/bash
# ============================================
# Codex Client - Script per interazione con Codex API
# ============================================
# Uso: codex-client.sh <comando> [args...]
#
# Comandi:
#   pending              - Lista issue con istruzioni pendenti
#   issues [status]      - Lista issue (opzionale: open/closed/in_progress)
#   show <id>            - Dettaglio issue
#   status <id> <status> - Cambia status (open/in_progress/closed)
#   comment <id> <text>  - Aggiungi commento
#   complete <id> <text> - Marca istruzione completata
#   create <title>       - Crea nuova issue
#
# Richiede:
#   CODEX_URL   - URL del server Codex (es: http://codex:3000)
#   CODEX_TOKEN - Token di autenticazione

set -e

# Config
CODEX_URL="${CODEX_URL:-http://codex:3000}"
AUTH_HEADER="Authorization: Bearer $CODEX_TOKEN"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
api_get() {
    curl -s -H "$AUTH_HEADER" "$CODEX_URL$1"
}

api_post() {
    curl -s -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" -d "$2" "$CODEX_URL$1"
}

api_put() {
    curl -s -X PUT -H "$AUTH_HEADER" -H "Content-Type: application/json" -d "$2" "$CODEX_URL$1"
}

print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Commands
cmd_pending() {
    print_header "ISTRUZIONI PENDENTI"
    result=$(api_get "/api/issues/pending")
    count=$(echo "$result" | jq -r '.count // 0')

    if [ "$count" = "0" ]; then
        echo -e "${GREEN}Nessuna istruzione pendente${NC}"
        return
    fi

    echo -e "${YELLOW}$count issue con istruzioni:${NC}"
    echo ""
    echo "$result" | jq -r '.issues[] | "[\(.id)] \(.title)\n  └─ \(.pending_count) istruzione(i) pendente(i)"'
}

cmd_issues() {
    local status="$1"
    local endpoint="/api/issues"
    [ -n "$status" ] && endpoint="$endpoint?status=$status"

    print_header "LISTA ISSUES${status:+ ($status)}"
    api_get "$endpoint" | jq -r '.issues[] | "[\(.id)] [\(.status)] \(.title)"'
}

cmd_show() {
    local id="$1"
    [ -z "$id" ] && { echo "Uso: codex-client.sh show <id>"; exit 1; }

    print_header "ISSUE $id"
    result=$(api_get "/api/issues/$id")

    echo "$result" | jq -r '
        .issue |
        "ID:     \(.id)",
        "Title:  \(.title)",
        "Status: \(.status)",
        "Type:   \(.issue_type // "task")",
        "",
        "Description:",
        (.description // "N/A"),
        "",
        "Comments (\(.comments | length)):"
    '

    echo "$result" | jq -r '.issue.comments[] | "  [\(.author // "?")] \(.text)"'
}

cmd_status() {
    local id="$1"
    local status="$2"
    [ -z "$id" ] || [ -z "$status" ] && { echo "Uso: codex-client.sh status <id> <open|in_progress|closed>"; exit 1; }

    result=$(api_put "/api/issues/$id/status" "{\"status\": \"$status\"}")
    if echo "$result" | jq -e '.ok' > /dev/null; then
        echo -e "${GREEN}Status aggiornato: $id → $status${NC}"
    else
        echo -e "${RED}Errore: $(echo "$result" | jq -r '.message')${NC}"
    fi
}

cmd_comment() {
    local id="$1"
    shift
    local text="$*"
    [ -z "$id" ] || [ -z "$text" ] && { echo "Uso: codex-client.sh comment <id> <text>"; exit 1; }

    result=$(api_post "/api/issues/$id/comments" "{\"text\": \"$text\"}")
    if echo "$result" | jq -e '.ok' > /dev/null; then
        echo -e "${GREEN}Commento aggiunto a $id${NC}"
    else
        echo -e "${RED}Errore: $(echo "$result" | jq -r '.message')${NC}"
    fi
}

cmd_complete() {
    local id="$1"
    shift
    local text="$*"
    [ -z "$id" ] || [ -z "$text" ] && { echo "Uso: codex-client.sh complete <id> <result_text>"; exit 1; }

    result=$(api_post "/api/issues/$id/complete" "{\"result\": \"$text\", \"author\": \"Claude Code\"}")
    if echo "$result" | jq -e '.ok' > /dev/null; then
        echo -e "${GREEN}Istruzione completata: $id${NC}"
    else
        echo -e "${RED}Errore: $(echo "$result" | jq -r '.message')${NC}"
    fi
}

cmd_create() {
    local title="$*"
    [ -z "$title" ] && { echo "Uso: codex-client.sh create <title>"; exit 1; }

    result=$(api_post "/api/issues" "{\"title\": \"$title\", \"type\": \"task\"}")
    if echo "$result" | jq -e '.ok' > /dev/null; then
        new_id=$(echo "$result" | jq -r '.id')
        echo -e "${GREEN}Issue creata: $new_id${NC}"
    else
        echo -e "${RED}Errore: $(echo "$result" | jq -r '.message')${NC}"
    fi
}

cmd_help() {
    echo "Codex Client - Interazione con Codex API"
    echo ""
    echo "Uso: codex-client.sh <comando> [args...]"
    echo ""
    echo "Comandi:"
    echo "  pending              Lista issue con istruzioni pendenti"
    echo "  issues [status]      Lista issue"
    echo "  show <id>            Dettaglio issue"
    echo "  status <id> <stato>  Cambia status"
    echo "  comment <id> <text>  Aggiungi commento"
    echo "  complete <id> <text> Marca completata"
    echo "  create <title>       Crea nuova issue"
    echo ""
    echo "Environment:"
    echo "  CODEX_URL=$CODEX_URL"
    echo "  CODEX_TOKEN=${CODEX_TOKEN:0:8}..."
}

# Main
case "${1:-help}" in
    pending)  cmd_pending ;;
    issues)   cmd_issues "$2" ;;
    show)     cmd_show "$2" ;;
    status)   cmd_status "$2" "$3" ;;
    comment)  cmd_comment "$2" "${@:3}" ;;
    complete) cmd_complete "$2" "${@:3}" ;;
    create)   cmd_create "${@:2}" ;;
    help|*)   cmd_help ;;
esac
