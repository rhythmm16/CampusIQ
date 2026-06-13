# CampusIQ MCP Server - Complete Integration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Platform-Specific Setup](#platform-specific-setup)
7. [Troubleshooting](#troubleshooting)
8. [Usage Examples](#usage-examples)
9. [Advanced Configuration](#advanced-configuration)

---

## 🎯 Overview

The CampusIQ MCP Server exposes your campus navigation agent as a set of tools that can be used by any MCP-compatible AI assistant (Claude Desktop, ChatGPT, etc.).

### What Gets Exposed:

✅ **8 Navigation Tools:**
- Building search and info
- Accessible route calculation
- Building hours lookup
- Live campus status
- Safety POIs
- Events and blockages
- Weather routing
- Photo identification (Snap & Navigate)

✅ **2 Resources:**
- Campus info and statistics
- Complete building directory

✅ **3 Prompt Templates:**
- Navigate to building
- Emergency navigation
- Accessibility audit

---

## 📦 Prerequisites

### Required:

1. **Python 3.9 or higher**
   ```bash
   python --version
   # Should output: Python 3.9.x or higher
   ```

2. **pip (Python package manager)**
   ```bash
   pip --version
   ```

3. **Groq API Key** (Free tier available)
   - Sign up at: https://console.groq.com
   - Get your API key from the dashboard
   - Free tier includes: 14,400 requests/day

### Optional but Recommended:

4. **uv/uvx** (Modern Python package manager)
   ```bash
   # Windows (PowerShell as Administrator):
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   
   # macOS/Linux:
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

5. **Claude Desktop** (For testing)
   - Download from: https://claude.ai/download

---

## 🚀 Installation

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

**Option A: Using pip (Standard)**
```bash
pip install -r requirements.txt
```

**Option B: Using uv (Faster)**
```bash
uv pip install -r requirements.txt
```

### Step 3: Verify Installation

```bash
python test_mcp.py
```

You should see all tests passing ✓

---

## ⚙️ Configuration

### Step 1: Set Up Environment Variables

1. **Check if `.env` file exists:**
   ```bash
   # Windows
   dir .env
   
   # Linux/macOS
   ls -la .env
   ```

2. **If it doesn't exist, create from example:**
   ```bash
   # Windows
   copy .env.example .env
   
   # Linux/macOS
   cp .env.example .env
   ```

3. **Edit `.env` and add your Groq API key:**
   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_VISION_MODEL=llama-3.2-90b-vision-preview
   ```

### Step 2: Configure Claude Desktop

1. **Find the Claude config file:**

   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Open the config file** (create if it doesn't exist)

3. **Add CampusIQ configuration:**

   **Method A: Direct Python (Recommended for Development)**
   
   Replace `C:/Users/LENOVO/Downloads/campusapp/campusapp/backend/mcp_server.py` with your actual path:
   
   ```json
   {
     "mcpServers": {
       "campusiq": {
         "command": "python",
         "args": [
           "C:/Users/LENOVO/Downloads/campusapp/campusapp/backend/mcp_server.py"
         ],
         "env": {
           "GROQ_API_KEY": "gsk_your_actual_key_here"
         }
       }
     }
   }
   ```

   **Method B: Using uvx (Recommended for Production)**
   
   ```json
   {
     "mcpServers": {
       "campusiq": {
         "command": "uvx",
         "args": ["--from", ".", "mcp_server"],
         "cwd": "C:/Users/LENOVO/Downloads/campusapp/campusapp/backend",
         "env": {
           "GROQ_API_KEY": "gsk_your_actual_key_here"
         }
       }
     }
   }
   ```

4. **Save the file**

5. **Restart Claude Desktop completely**
   - Close all Claude windows
   - Quit from system tray if running
   - Restart Claude

---

## 🧪 Testing

### Test 1: Run MCP Server Directly

```bash
python mcp_server.py
```

**Expected output:**
```
🎓 CampusIQ MCP Server Starting...
📁 Backend Directory: C:\Users\LENOVO\Downloads\campusapp\campusapp\backend
🔑 Groq API Key: Configured ✓
============================================================
```

Press `Ctrl+C` to stop.

### Test 2: Run Test Suite

```bash
python test_mcp.py
```

**Expected output:**
```
============================================================
CampusIQ MCP Server Test Suite
============================================================

Testing imports...
  ✓ fastmcp 0.1.0
  ✓ python-dotenv
  ✓ httpx
  ✓ app.tools
  ✓ app.data

Testing data loading...
  ✓ Loaded 15 buildings
  ✓ Loaded 24 paths

Testing tools...
  ✓ find_building: Found 'Main Library'
  ✓ calculate_route: Route found

Testing environment...
  ✓ .env file found
  ✓ GROQ_API_KEY configured (gsk_abc123...)

Testing MCP server...
  ✓ MCP server module loaded
  ✓ MCP instance created

============================================================
Test Results
============================================================
✓ PASS   Imports
✓ PASS   Data Loading
✓ PASS   Tools
✓ PASS   Environment
✓ PASS   MCP Server

🎉 All tests passed! MCP server is ready to use.
```

### Test 3: Verify Claude Connection

1. Open Claude Desktop
2. Look for the 🔌 icon in the bottom-right or connection indicator
3. Click on it to see connected MCP servers
4. You should see "campusiq" listed

### Test 4: Try a Query in Claude

In Claude, type:
```
What buildings are available on campus?
```

Claude should use the `campus_find_building` or `campus://buildings/list` resource to answer.

---

## 🖥️ Platform-Specific Setup

### Windows

1. **Run Setup Script:**
   ```cmd
   setup_mcp.bat
   ```

2. **Claude Config Location:**
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```
   
   Or open with:
   ```cmd
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```

3. **Python Path (use forward slashes):**
   ```json
   "args": ["C:/Users/LENOVO/Downloads/campusapp/campusapp/backend/mcp_server.py"]
   ```

### macOS

1. **Run Setup Script:**
   ```bash
   chmod +x setup_mcp.sh
   ./setup_mcp.sh
   ```

2. **Claude Config Location:**
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```
   
   Or open with:
   ```bash
   open -e ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Python Path:**
   ```json
   "args": ["/Users/yourusername/campusapp/backend/mcp_server.py"]
   ```

### Linux

1. **Run Setup Script:**
   ```bash
   chmod +x setup_mcp.sh
   ./setup_mcp.sh
   ```

2. **Claude Config Location:**
   ```
   ~/.config/Claude/claude_desktop_config.json
   ```
   
   Or open with:
   ```bash
   nano ~/.config/Claude/claude_desktop_config.json
   ```

3. **Python Path:**
   ```json
   "args": ["/home/yourusername/campusapp/backend/mcp_server.py"]
   ```

---

## 🔧 Troubleshooting

### Issue: "Module not found" Error

**Symptoms:**
```
ModuleNotFoundError: No module named 'fastmcp'
```

**Solutions:**
```bash
# Reinstall dependencies
pip install --upgrade fastmcp python-dotenv httpx

# Or if using uv:
uv pip install fastmcp python-dotenv httpx
```

### Issue: Claude Can't Connect

**Symptoms:**
- No 🔌 icon in Claude
- "Failed to connect to MCP server" message

**Solutions:**

1. **Check config file syntax:**
   - Use https://jsonlint.com to validate JSON
   - Make sure all brackets and commas are correct
   - No trailing commas allowed in JSON

2. **Check Python path:**
   ```bash
   # Windows
   where python
   
   # macOS/Linux
   which python3
   ```
   
   Use the full path in config if needed:
   ```json
   "command": "C:/Python39/python.exe"
   ```

3. **Check file path:**
   - Use absolute paths
   - Use forward slashes (/) even on Windows
   - No spaces in JSON (use \\ for escaping if needed)

4. **Check permissions:**
   ```bash
   # Linux/macOS - make sure file is executable
   chmod +x mcp_server.py
   ```

5. **Restart Claude completely:**
   - Close all windows
   - Quit from system tray/menu bar
   - Wait 5 seconds
   - Reopen

### Issue: "Vision model not configured"

**Symptoms:**
```
{"building_id": null, "reason": "Vision model not configured"}
```

**Solutions:**

1. **Check GROQ_API_KEY is set:**
   ```bash
   # In backend directory
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GROQ_API_KEY'))"
   ```

2. **Add API key to Claude config:**
   ```json
   "env": {
     "GROQ_API_KEY": "gsk_your_key_here"
   }
   ```

3. **Verify Groq account has vision access:**
   - Log in to console.groq.com
   - Check quota and limits

### Issue: Import Errors

**Symptoms:**
```
ImportError: cannot import name 'find_building' from 'app.tools'
```

**Solutions:**

1. **Make sure you're in backend directory:**
   ```bash
   pwd  # Should show: .../campusapp/backend
   cd backend  # If not
   ```

2. **Check data file exists:**
   ```bash
   ls data/campus.json
   # Should exist
   ```

3. **Verify app module:**
   ```bash
   python -c "from app.tools import find_building; print('OK')"
   ```

### Issue: No Buildings Found

**Symptoms:**
```
{"found": False, "message": "Building not found"}
```

**Solutions:**

1. **Check campus data:**
   ```bash
   python -c "from app.data import all_buildings; print(len(all_buildings()))"
   # Should print number > 0
   ```

2. **Regenerate data:**
   ```bash
   cd ..  # Go to project root
   npm run backend:export-data
   cd backend
   ```

### Issue: Python Version Too Old

**Symptoms:**
```
SyntaxError: invalid syntax
```

**Solutions:**

1. **Check Python version:**
   ```bash
   python --version
   # Must be 3.9 or higher
   ```

2. **Install newer Python:**
   - Windows: https://python.org/downloads
   - macOS: `brew install python@3.11`
   - Linux: `sudo apt install python3.11`

3. **Use specific version in config:**
   ```json
   "command": "python3.11"
   ```

---

## 💬 Usage Examples

Once connected to Claude, try these queries:

### Basic Navigation
```
How do I get to the library?
```

### Accessible Routes
```
I use a wheelchair. Show me an accessible route to the engineering building.
```

### Building Information
```
Tell me about the student center - what's there and is it open now?
```

### Live Status
```
Where can I eat that's not crowded right now?
```

### Multi-Step Planning
```
I need to go to the library, then the cafeteria, then back to the CS building. 
I prefer wheelchair-accessible routes. Can you plan this for me?
```

### Emergency
```
Show me all emergency exits and the nearest one from the main gate.
```

### Photo Identification
```
[Upload photo]
What building is this and how do I get to the library from here?
```

### Accessibility Audit
```
Run an accessibility audit of the campus - which buildings can I reach 
by wheelchair and which ones can't I access?
```

---

## 🔬 Advanced Configuration

### Custom Campus Data

To use with a different campus:

1. **Create new campus.json:**
   ```bash
   cp data/campus.json data/my_campus.json
   ```

2. **Edit my_campus.json with your campus data**

3. **Update data.py:**
   ```python
   DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "my_campus.json"
   ```

### Multiple Campus Support

Deploy multiple MCP servers:

```json
{
  "mcpServers": {
    "campus-stanford": {
      "command": "python",
      "args": ["/path/to/stanford/mcp_server.py"],
      "env": {"GROQ_API_KEY": "..."}
    },
    "campus-mit": {
      "command": "python",
      "args": ["/path/to/mit/mcp_server.py"],
      "env": {"GROQ_API_KEY": "..."}
    }
  }
}
```

### Custom Tool Names

Edit `mcp_server.py`:

```python
@mcp.tool()
def my_custom_campus_tool(query: str) -> dict:
    """Custom tool description"""
    # Your implementation
    pass
```

### Performance Tuning

1. **Cache campus data in memory:**
   Already implemented via `@lru_cache`

2. **Adjust Groq model:**
   ```env
   GROQ_MODEL=llama-3.1-70b-versatile  # Faster but less capable
   GROQ_MODEL=llama-3.3-70b-versatile  # Default, balanced
   ```

3. **Add request timeout:**
   ```python
   # In agent.py
   completion = self._client.chat.completions.create(
       ...,
       timeout=30.0  # seconds
   )
   ```

---

## 📚 Additional Resources

- **MCP Documentation:** https://modelcontextprotocol.io
- **FastMCP GitHub:** https://github.com/jlowin/fastmcp
- **Groq API Docs:** https://console.groq.com/docs
- **Claude Desktop:** https://claude.ai/download

---

## 🎓 Tutorial: First-Time Setup (Step-by-Step)

### Complete Walkthrough for Absolute Beginners

#### 1. Check Prerequisites (5 minutes)

```bash
# Open terminal/command prompt
# Check Python
python --version

# If not installed, download from python.org
```

#### 2. Get Groq API Key (2 minutes)

1. Go to https://console.groq.com
2. Sign up (free)
3. Click "API Keys" in sidebar
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

#### 3. Configure Environment (3 minutes)

```bash
# Navigate to backend
cd C:\Users\LENOVO\Downloads\campusapp\campusapp\backend

# Create .env file
copy .env.example .env

# Edit .env (use notepad or any editor)
notepad .env

# Add your key:
GROQ_API_KEY=gsk_paste_your_key_here
```

Save and close.

#### 4. Install Dependencies (2 minutes)

```bash
# Run setup script
setup_mcp.bat  # Windows
./setup_mcp.sh  # Mac/Linux

# Wait for installation to complete
```

#### 5. Test Installation (1 minute)

```bash
python test_mcp.py

# Should see all ✓ PASS
```

#### 6. Install Claude Desktop (3 minutes)

1. Go to https://claude.ai/download
2. Download for your OS
3. Install
4. Sign in with your account

#### 7. Configure Claude (5 minutes)

```bash
# Open Claude config
# Windows:
notepad %APPDATA%\Claude\claude_desktop_config.json

# Create file if it doesn't exist with this content:
```

```json
{
  "mcpServers": {
    "campusiq": {
      "command": "python",
      "args": [
        "C:/Users/LENOVO/Downloads/campusapp/campusapp/backend/mcp_server.py"
      ],
      "env": {
        "GROQ_API_KEY": "gsk_your_key_from_step_2"
      }
    }
  }
}
```

**IMPORTANT:** 
- Replace the path with YOUR actual path
- Use forward slashes (/) not backslashes (\\)
- Replace the API key with your actual key

Save and close.

#### 8. Test in Claude (2 minutes)

1. Close Claude completely (right-click system tray → Quit)
2. Wait 5 seconds
3. Reopen Claude
4. Look for 🔌 icon
5. Type: "What buildings are on campus?"

**Success!** Claude should respond with campus building information.

---

## ✅ Success Checklist

Before asking for help, verify:

- [ ] Python 3.9+ installed (`python --version`)
- [ ] All dependencies installed (`pip list | grep fastmcp`)
- [ ] .env file exists and has GROQ_API_KEY
- [ ] data/campus.json exists and has buildings
- [ ] test_mcp.py passes all tests
- [ ] claude_desktop_config.json is valid JSON
- [ ] File paths use forward slashes (/)
- [ ] File paths are absolute (full path)
- [ ] Claude Desktop fully restarted
- [ ] 🔌 icon visible in Claude

---

**Need Help?** 

Check the Troubleshooting section above or file an issue with:
1. Output of `python test_mcp.py`
2. Your claude_desktop_config.json (remove API key)
3. Operating system and Python version
4. Full error message

**Good luck! 🎓**
