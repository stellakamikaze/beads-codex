#!/bin/bash
# codex-client.sh - Client script for Claude Code to interact with Codex
#
# Usage:
#   ./codex-client.sh pending              # List pending instructions
#   ./codex-client.sh issues               # List all issues
#   ./codex-client.sh show <id>            # Show issue detail
#   ./codex-client.sh status <id> <status> # Update issue status
#   ./codex-client.sh comment <id> <text>  # Add comment
#   ./codex-client.sh complete <id> <text> # Mark instruction completed
#
# Environment variables:
#   CODEX_URL   - Codex server URL (default: http://localhost:3000)
#   CODEX_TOKEN - API authentication token

set -e

CODEX_URL="${CODEX_URL:-http://localhost:3000}"
AUTH_HEADER=""

if [ -n "$CODEX_TOKEN" ]; then
    AUTH_HEADER="-H \"Authorization: Bearer $CODEX_TOKEN\""
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

cmd_pending() {
    echo -e "${CYAN}Checking for pending instructions...${NC}"

    response=$(curl -s -w "\n%{http_code}" \
        ${AUTH_HEADER:+-H "Authorization: Bearer $CODEX_TOKEN"} \
        "$CODEX_URL/api/issues/pending")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        echo -e "${RED}Error: HTTP $http_code${NC}"
        echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$body"
        exit 1
    fi

    count=$(echo "$body" | jq -r '.count // 0')

    if [ "$count" = "0" ]; then
        echo -e "${GREEN}No pending instructions${NC}"
        exit 0
    fi

    echo -e "${YELLOW}Found $count issue(s) with pending instructions:${NC}"
    echo ""

    echo "$body" | jq -r '.issues[] | "\(.id) [\(.status)] \(.title)\n  Pending: \(.pending_count) instruction(s)\n  Instructions:\n" + (.pending_instructions | map("    - " + .text) | join("\n")) + "\n"'
}

cmd_issues() {
    status_filter="${1:-}"

    url="$CODEX_URL/api/issues"
    if [ -n "$status_filter" ]; then
        url="$url?status=$status_filter"
    fi

    response=$(curl -s -w "\n%{http_code}" \
        ${AUTH_HEADER:+-H "Authorization: Bearer $CODEX_TOKEN"} \
        "$url")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        echo -e "${RED}Error: HTTP $http_code${NC}"
        echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$body"
        exit 1
    fi

    echo "$body" | jq -r '.issues[] | "\(.id) [\(.status)] \(.title)"'
}

cmd_show() {
    id="$1"
    if [ -z "$id" ]; then
        echo -e "${RED}Error: issue ID required${NC}"
        echo "Usage: $0 show <id>"
        exit 1
    fi

    response=$(curl -s -w "\n%{http_code}" \
        ${AUTH_HEADER:+-H "Authorization: Bearer $CODEX_TOKEN"} \
        "$CODEX_URL/api/issues/$id")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        echo -e "${RED}Error: HTTP $http_code${NC}"
        echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$body"
        exit 1
    fi

    echo "$body" | jq '.'
}

cmd_status() {
    id="$1"
    status="$2"

    if [ -z "$id" ] || [ -z "$status" ]; then
        echo -e "${RED}Error: issue ID and status required${NC}"
        echo "Usage: $0 status <id> <open|in_progress|closed>"
        exit 1
    fi

    response=$(curl -s -w "\n%{http_code}" \
        -X PUT \
        -H "Content-Type: application/json" \
        ${AUTH_HEADER:+-H "Authorization: Bearer $CODEX_TOKEN"} \
        -d "{\"status\": \"$status\"}" \
        "$CODEX_URL/api/issues/$id/status")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        echo -e "${RED}Error: HTTP $http_code${NC}"
        echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$body"
        exit 1
    fi

    echo -e "${GREEN}Updated $id → $status${NC}"
}

cmd_comment() {
    id="$1"
    shift
    text="$*"

    if [ -z "$id" ] || [ -z "$text" ]; then
        echo -e "${RED}Error: issue ID and text required${NC}"
        echo "Usage: $0 comment <id> <text>"
        exit 1
    fi

    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        ${AUTH_HEADER:+-H "Authorization: Bearer $CODEX_TOKEN"} \
        -d "{\"text\": \"$text\", \"author\": \"Claude Code\"}" \
        "$CODEX_URL/api/issues/$id/comments")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        echo -e "${RED}Error: HTTP $http_code${NC}"
        echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$body"
        exit 1
    fi

    echo -e "${GREEN}Comment added to $id${NC}"
}

cmd_complete() {
    id="$1"
    shift
    result="$*"

    if [ -z "$id" ] || [ -z "$result" ]; then
        echo -e "${RED}Error: issue ID and result text required${NC}"
        echo "Usage: $0 complete <id> <result text>"
        exit 1
    fi

    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        ${AUTH_HEADER:+-H "Authorization: Bearer $CODEX_TOKEN"} \
        -d "{\"result\": \"$result\", \"author\": \"Claude Code\"}" \
        "$CODEX_URL/api/issues/$id/complete")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        echo -e "${RED}Error: HTTP $http_code${NC}"
        echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$body"
        exit 1
    fi

    echo -e "${GREEN}Instruction completed for $id${NC}"
}

# Main
case "${1:-}" in
    pending)
        cmd_pending
        ;;
    issues)
        cmd_issues "$2"
        ;;
    show)
        cmd_show "$2"
        ;;
    status)
        cmd_status "$2" "$3"
        ;;
    comment)
        shift
        cmd_comment "$@"
        ;;
    complete)
        shift
        cmd_complete "$@"
        ;;
    *)
        echo "Codex Client - Interact with Codex from Claude Code"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  pending              List issues with pending instructions"
        echo "  issues [status]      List all issues (optionally filter by status)"
        echo "  show <id>            Show issue detail with comments"
        echo "  status <id> <status> Update issue status (open|in_progress|closed)"
        echo "  comment <id> <text>  Add comment to issue"
        echo "  complete <id> <text> Mark instruction as completed with result"
        echo ""
        echo "Environment:"
        echo "  CODEX_URL   - Server URL (default: http://localhost:3000)"
        echo "  CODEX_TOKEN - API authentication token"
        exit 1
        ;;
esac
