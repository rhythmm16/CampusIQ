#!/bin/bash
# CampusIQ MCP Server Setup Script for Linux/macOS

set -e

echo "========================================"
echo " CampusIQ MCP Server Setup"
echo "========================================"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.9+ from https://python.org"
    exit 1
fi

echo "[1/4] Checking Python version..."
python3 --version

echo ""
echo "[2/4] Installing MCP dependencies..."
pip3 install fastmcp python-dotenv httpx

echo ""
echo "[3/4] Verifying installation..."
python3 -c "import fastmcp; print('FastMCP version:', fastmcp.__version__)" || echo "[WARNING] FastMCP import failed"

echo ""
echo "[4/4] Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "[WARNING] .env file not found!"
    echo "Please create .env and add your GROQ_API_KEY"
else
    if grep -q "GROQ_API_KEY" .env; then
        echo "[OK] GROQ_API_KEY configured"
    else
        echo "[WARNING] GROQ_API_KEY not found in .env"
    fi
fi

echo ""
echo "========================================"
echo " Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure GROQ_API_KEY is in your .env file"
echo "2. Test the server: python3 mcp_server.py"
echo "3. Configure Claude Desktop (see MCP_README.md)"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Configuration path for Claude Desktop (macOS):"
    echo "~/Library/Application Support/Claude/claude_desktop_config.json"
else
    echo "Configuration path for Claude Desktop (Linux):"
    echo "~/.config/Claude/claude_desktop_config.json"
fi
echo ""
