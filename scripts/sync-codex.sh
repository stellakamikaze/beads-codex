#!/bin/bash
# sync-codex.sh - Sync local beads with beads-codex server
#
# Usage:
#   ./scripts/sync-codex.sh push    # Push local beads to server
#   ./scripts/sync-codex.sh pull    # Pull beads from server (show only)
#   ./scripts/sync-codex.sh status  # Show sync status

set -e

# Configuration
CODEX_URL="${CODEX_URL:-http://localhost:3000}"
CODEX_USER="${CODEX_USER:-admin}"
CODEX_PASS="${CODEX_PASS:-admin123}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get auth token
get_token() {
    local response=$(curl -s -X POST "$CODEX_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$CODEX_USER\",\"password\":\"$CODEX_PASS\"}")

    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Push local beads to server
push_beads() {
    echo -e "${YELLOW}Syncing local beads to beads-codex...${NC}"

    # Get token
    TOKEN=$(get_token)
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Failed to authenticate${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Authenticated${NC}"

    # Get local beads
    BEADS=$(bd list --json 2>/dev/null || echo "[]")
    COUNT=$(echo "$BEADS" | jq 'length')

    if [ "$COUNT" = "0" ]; then
        echo -e "${YELLOW}No local beads to sync${NC}"
        exit 0
    fi

    echo -e "Found ${GREEN}$COUNT${NC} local beads"

    # Transform beads for API (add timestamps in ms)
    PAYLOAD=$(echo "$BEADS" | jq '{
        source: "claude-code-local",
        beads: [.[] | {
            id: .id,
            title: .title,
            description: .description,
            status: .status,
            priority: .priority,
            issue_type: .issue_type,
            assignee: .assignee,
            created_at: ((.created_at | split(".")[0] + "Z") | fromdateiso8601 * 1000),
            updated_at: ((.updated_at | split(".")[0] + "Z") | fromdateiso8601 * 1000)
        }]
    }')

    # Push to server
    RESULT=$(curl -s -X POST "$CODEX_URL/api/sync/push" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")

    CREATED=$(echo "$RESULT" | jq -r '.created // 0')
    UPDATED=$(echo "$RESULT" | jq -r '.updated // 0')
    CONFLICTS=$(echo "$RESULT" | jq -r '.conflicts // 0')

    echo -e "${GREEN}✓ Sync complete${NC}"
    echo -e "  Created: ${GREEN}$CREATED${NC}"
    echo -e "  Updated: ${GREEN}$UPDATED${NC}"
    echo -e "  Conflicts: ${YELLOW}$CONFLICTS${NC}"
}

# Pull beads from server (display only)
pull_beads() {
    echo -e "${YELLOW}Pulling beads from beads-codex...${NC}"

    # Get token
    TOKEN=$(get_token)
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Failed to authenticate${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Authenticated${NC}"

    # Pull from server
    RESULT=$(curl -s "$CODEX_URL/api/sync/pull" \
        -H "Authorization: Bearer $TOKEN")

    TOTAL=$(echo "$RESULT" | jq -r '.total // 0')
    echo -e "Server has ${GREEN}$TOTAL${NC} beads"

    # Show beads
    echo "$RESULT" | jq -r '.beads[] | "  [\(.status)] \(.id): \(.title)"' 2>/dev/null || echo "  No beads on server"
}

# Bidirectional sync - push local, pull and create missing locally
sync_beads() {
    echo -e "${YELLOW}=== Bidirectional Sync ===${NC}"

    # Get token
    TOKEN=$(get_token)
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Failed to authenticate${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Authenticated${NC}"

    # Step 1: Push local beads to server
    echo -e "\n${YELLOW}Step 1: Push local → server${NC}"
    BEADS=$(bd list --json 2>/dev/null || echo "[]")
    LOCAL_COUNT=$(echo "$BEADS" | jq 'length')
    LOCAL_IDS=$(echo "$BEADS" | jq -r '.[].id' | sort)

    if [ "$LOCAL_COUNT" != "0" ]; then
        PAYLOAD=$(echo "$BEADS" | jq '{
            source: "claude-code-local",
            beads: [.[] | {
                id: .id,
                title: .title,
                description: .description,
                status: .status,
                priority: .priority,
                issue_type: .issue_type,
                assignee: .assignee,
                created_at: ((.created_at | split(".")[0] + "Z") | fromdateiso8601 * 1000),
                updated_at: ((.updated_at | split(".")[0] + "Z") | fromdateiso8601 * 1000)
            }]
        }')

        PUSH_RESULT=$(curl -s -X POST "$CODEX_URL/api/sync/push" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD")

        PUSHED=$(echo "$PUSH_RESULT" | jq -r '(.created // 0) + (.updated // 0)')
        echo -e "  Pushed: ${GREEN}$PUSHED${NC} beads"
    else
        echo -e "  ${YELLOW}No local beads${NC}"
    fi

    # Step 2: Pull from server and create missing locally
    echo -e "\n${YELLOW}Step 2: Pull server → local${NC}"
    PULL_RESULT=$(curl -s "$CODEX_URL/api/sync/pull" \
        -H "Authorization: Bearer $TOKEN")

    SERVER_BEADS=$(echo "$PULL_RESULT" | jq -c '.beads // []')
    SERVER_COUNT=$(echo "$SERVER_BEADS" | jq 'length')
    echo -e "  Server has: ${GREEN}$SERVER_COUNT${NC} beads"

    # Find beads that exist on server but not locally
    CREATED=0
    UPDATED=0

    # Process each bead using jq indices
    SERVER_LEN=$(echo "$SERVER_BEADS" | jq 'length')
    for ((i=0; i<SERVER_LEN; i++)); do
        ID=$(echo "$SERVER_BEADS" | jq -r ".[$i].id")
        TITLE=$(echo "$SERVER_BEADS" | jq -r ".[$i].title")
        TYPE=$(echo "$SERVER_BEADS" | jq -r ".[$i].issue_type // .[$i].type // \"task\"")
        STATUS=$(echo "$SERVER_BEADS" | jq -r ".[$i].status // \"open\"")
        PRIORITY=$(echo "$SERVER_BEADS" | jq -r ".[$i].priority // \"p2\"")

        # Check if exists locally
        if ! echo "$LOCAL_IDS" | grep -q "^${ID}$"; then
            # Create locally with bd create (then update status if needed)
            echo -e "  Creating ${GREEN}$ID${NC}: $TITLE"
            if bd create --id "$ID" --type "$TYPE" -p "$PRIORITY" "$TITLE" 2>/dev/null; then
                # Update status if not 'open'
                if [ "$STATUS" != "open" ]; then
                    bd update "$ID" --status "$STATUS" 2>/dev/null || true
                fi
                CREATED=$((CREATED + 1))
            else
                echo -e "    ${RED}Failed to create${NC}"
            fi
        else
            # Update status if different
            LOCAL_STATUS=$(echo "$BEADS" | jq -r ".[] | select(.id == \"$ID\") | .status")
            if [ "$LOCAL_STATUS" != "$STATUS" ]; then
                echo -e "  Updating ${YELLOW}$ID${NC}: $LOCAL_STATUS → $STATUS"
                bd update "$ID" --status "$STATUS" 2>/dev/null || true
                UPDATED=$((UPDATED + 1))
            fi
        fi
    done

    echo -e "\n${GREEN}✓ Sync complete${NC}"
    echo -e "  Created locally: ${GREEN}$CREATED${NC}"
    echo -e "  Updated locally: ${GREEN}$UPDATED${NC}"
}

# Show sync status
show_status() {
    echo -e "${YELLOW}Sync Status${NC}"
    echo ""

    # Local beads
    LOCAL_COUNT=$(bd list --json 2>/dev/null | jq 'length' || echo "0")
    echo -e "Local beads: ${GREEN}$LOCAL_COUNT${NC}"

    # Get token
    TOKEN=$(get_token)
    if [ -z "$TOKEN" ]; then
        echo -e "Server: ${RED}Not connected${NC}"
        exit 1
    fi

    # Server beads
    SERVER_STATUS=$(curl -s "$CODEX_URL/api/sync/status" \
        -H "Authorization: Bearer $TOKEN")
    SERVER_COUNT=$(echo "$SERVER_STATUS" | jq -r '.beadsCount // 0')

    echo -e "Server beads: ${GREEN}$SERVER_COUNT${NC}"
    echo -e "Server URL: $CODEX_URL"
}

# Main
case "${1:-status}" in
    push)
        push_beads
        ;;
    pull)
        pull_beads
        ;;
    sync)
        sync_beads
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {push|pull|sync|status}"
        echo ""
        echo "Commands:"
        echo "  push    Push local beads to server"
        echo "  pull    Show beads on server"
        echo "  sync    Bidirectional sync (push + pull with local creation)"
        echo "  status  Show sync status"
        exit 1
        ;;
esac
