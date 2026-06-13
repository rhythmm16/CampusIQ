@echo off
REM CampusIQ MCP Server Setup Script for Windows

echo ========================================
echo  CampusIQ MCP Server Setup
echo ========================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

echo [1/4] Checking Python version...
python --version

echo.
echo [2/4] Installing MCP dependencies...
pip install fastmcp python-dotenv httpx
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Verifying installation...
python -c "import fastmcp; print('FastMCP version:', fastmcp.__version__)" 2>nul
if errorlevel 1 (
    echo [WARNING] FastMCP import failed, but continuing...
)

echo.
echo [4/4] Checking environment configuration...
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Please create .env and add your GROQ_API_KEY
) else (
    findstr /C:"GROQ_API_KEY" .env >nul
    if errorlevel 1 (
        echo [WARNING] GROQ_API_KEY not found in .env
    ) else (
        echo [OK] GROQ_API_KEY configured
    )
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure GROQ_API_KEY is in your .env file
echo 2. Test the server: python mcp_server.py
echo 3. Configure Claude Desktop (see MCP_README.md)
echo.
echo Configuration path for Claude Desktop:
echo %%APPDATA%%\Claude\claude_desktop_config.json
echo.

pause
