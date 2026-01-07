#!/bin/bash
# ============================================
# Setup script per Codex Stack su Unraid
# ============================================
set -e

INSTALL_DIR="/mnt/user/appdata/codex-stack"
PROJECTS_DIR="/mnt/user/appdata/projects"

echo "=========================================="
echo "  Codex + Claude Code Stack Setup"
echo "=========================================="

# Check if running on Unraid
if [ ! -d "/mnt/user" ]; then
    echo "Warning: Non sembra essere Unraid. Continuo comunque..."
fi

# Create directories
echo "[1/6] Creazione directory..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$PROJECTS_DIR"
mkdir -p "/mnt/user/appdata/claude-code/ssh"

# Copy files
echo "[2/6] Copia file di configurazione..."
cp docker-compose.yml "$INSTALL_DIR/"
cp .env.example "$INSTALL_DIR/.env"

# Generate CODEX_TOKEN if not set
if ! grep -q "CODEX_TOKEN=." "$INSTALL_DIR/.env"; then
    echo "[3/6] Generazione CODEX_TOKEN..."
    TOKEN=$(openssl rand -hex 32)
    sed -i "s/CODEX_TOKEN=/CODEX_TOKEN=$TOKEN/" "$INSTALL_DIR/.env"
    echo "  Token generato: $TOKEN"
else
    echo "[3/6] CODEX_TOKEN già presente, skip..."
fi

# Prompt for API key
echo ""
echo "[4/6] Configurazione ANTHROPIC_API_KEY..."
if grep -q "ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx" "$INSTALL_DIR/.env"; then
    echo "  ATTENZIONE: Devi inserire la tua ANTHROPIC_API_KEY in:"
    echo "  $INSTALL_DIR/.env"
    echo ""
    read -p "  Vuoi inserirla ora? (y/n): " answer
    if [ "$answer" = "y" ]; then
        read -p "  ANTHROPIC_API_KEY: " api_key
        sed -i "s/ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx/ANTHROPIC_API_KEY=$api_key/" "$INSTALL_DIR/.env"
    fi
fi

# Set permissions
echo "[5/6] Impostazione permessi..."
chmod 600 "$INSTALL_DIR/.env"
chmod -R 755 "$PROJECTS_DIR"

# Print summary
echo ""
echo "[6/6] Setup completato!"
echo ""
echo "=========================================="
echo "  PROSSIMI PASSI"
echo "=========================================="
echo ""
echo "1. Verifica la configurazione:"
echo "   nano $INSTALL_DIR/.env"
echo ""
echo "2. Avvia lo stack:"
echo "   cd $INSTALL_DIR && docker-compose up -d"
echo ""
echo "3. Accedi a Codex:"
echo "   http://<unraid-ip>:3000"
echo ""
echo "4. Usa Claude Code:"
echo "   docker exec -it claude-code cc"
echo ""
echo "5. (Opzionale) Configura Tailscale per accesso remoto"
echo ""
echo "=========================================="
echo "  VARIABILI GENERATE"
echo "=========================================="
echo ""
grep "CODEX_TOKEN=" "$INSTALL_DIR/.env"
echo ""
echo "Salva questo token per configurare Claude Code sul tuo PC!"
echo ""
