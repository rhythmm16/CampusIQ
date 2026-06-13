# CampusIQ MCP Server

**Model Context Protocol server for campus navigation** - Connect your campus to ChatGPT, Claude, and other AI assistants!

## 🎯 What This Does

Transform your campus navigation agent into a universal tool accessible from:
- ✅ **Claude Desktop** (Anthropic)
- ✅ **ChatGPT with plugins** (OpenAI)
- ✅ **IDEs** (VSCode, Cursor, etc.)
- ✅ **Any MCP-compatible client**

## 🚀 Quick Start

### Prerequisites

1. **Python 3.9+** installed
2. **Groq API Key** (free at [console.groq.com](https://console.groq.com))
3. **MCP-compatible client** (Claude Desktop recommended)

### Installation

#### Method 1: Direct Python (Recommended for Development)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install fastmcp python-dotenv httpx

# Set your API key
# Edit .env file and add:
GROQ_API_KEY=gsk_your_key_here

# Test the server
python mcp_server.py
```

#### Method 2: Using uvx (Recommended for Production)

```bash
# Install uv (Python package manager)
# Windows (PowerShell):
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify installation
uv --version
uvx --version

# The server will auto-install when configured in Claude
```

## ⚙️ Configuration

### For Claude Desktop

1. **Find config file location:**
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Add CampusIQ server:**

**Option A: Direct Python (Development)**
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

**Option B: Using uvx (Production)**
```json
{
  "mcpServers": {
    "campusiq": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/yourusername/campusapp", "mcp_server"],
      "env": {
        "GROQ_API_KEY": "gsk_your_actual_key_here"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

4. **Verify connection:**
   - Open Claude
   - Look for 🔌 icon indicating MCP connection
   - Try: "What buildings are on campus?"

### For ChatGPT (Custom GPT)

1. Create a Custom GPT at [chat.openai.com](https://chat.openai.com)
2. Add MCP connection in Actions
3. Point to your deployed MCP server endpoint

## 🛠️ Available Tools

The MCP server exposes these tools:

### 1. `campus_find_building`
Find any building by name, ID, or description
```
"Find the library"
"Where is the computer science building?"
```

### 2. `campus_calculate_route`
Calculate routes with accessibility options
```
"Get me to the library using wheelchair-accessible paths"
"Show scenic route to student center"
```

### 3. `campus_building_hours`
Check if buildings are open
```
"Is the gym open now?"
"What time does the cafeteria close?"
```

### 4. `campus_live_pulse`
Real-time campus status
```
"How crowded is the cafeteria?"
"Are there parking spots available?"
```

### 5. `campus_safety_pois`
Emergency and safety information
```
"Where are the emergency exits?"
"Show me AED locations"
```

### 6. `campus_events`
Current events affecting navigation
```
"What events are happening today?"
"Are any paths blocked?"
```

### 7. `campus_weather_routing`
Weather-aware routing
```
"Give me a route that avoids rain"
```

### 8. `campus_identify_building_from_photo`
Snap & Navigate - identify buildings from photos
```
"What building is this?" [with photo]
```

## 📚 Resources

The server also provides resources:

- `campus://info` - System capabilities and statistics
- `campus://buildings/list` - Complete building directory

## 🎯 Example Queries

Once connected to Claude/ChatGPT, try:

### Basic Navigation
```
"How do I get to the library from the main gate?"
```

### Accessible Routes
```
"I use a wheelchair. Show me how to reach the engineering building."
```

### Building Information
```
"Tell me about the student center - what services does it have and is it open?"
```

### Live Status
```
"Where's the least crowded place to eat right now?"
```

### Safety & Emergency
```
"Where's the nearest emergency exit from the science building?"
```

### Complex Queries
```
"I need to get to a building with a quiet study area that's open now 
and accessible by wheelchair. Can you find one and give me directions?"
```

## 🧪 Testing

Test the MCP server directly:

```bash
# Run in test mode
python mcp_server.py

# Should output:
# 🎓 CampusIQ MCP Server Starting...
# 📁 Backend Directory: C:\Users\LENOVO\Downloads\campusapp\campusapp\backend
# 🔑 Groq API Key: Configured ✓
# ============================================================
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install --upgrade fastmcp python-dotenv httpx
```

### Claude can't connect
1. Check config file path is correct
2. Verify JSON syntax (use [jsonlint.com](https://jsonlint.com))
3. Check absolute path to `mcp_server.py` is correct
4. Restart Claude Desktop completely

### "Vision model not configured"
Make sure `GROQ_API_KEY` is set in the `env` section of your config.

### Import errors
```bash
# Make sure you're in the backend directory
cd backend

# Verify app module exists
python -c "from app.tools import find_building; print('OK')"
```

## 🔒 Security Notes

- **API Keys:** Never commit API keys to git
- **Local Only:** MCP runs locally - no data sent to external servers except Groq
- **Environment Variables:** Use `.env` files for sensitive data

## 📈 Performance

- **Cold start:** ~2-3 seconds
- **Building search:** <100ms
- **Route calculation:** <200ms
- **Vision queries:** ~1-2 seconds (Groq API call)

## 🌍 Multi-Campus Support

To deploy for multiple campuses:

1. Copy `backend/` directory
2. Update `data/campus.json` with new campus data
3. Deploy as separate MCP servers with different names:
   ```json
   "campusiq-stanford": { ... },
   "campusiq-mit": { ... }
   ```

## 🤝 Contributing

This MCP server is built on:
- **FastMCP** - MCP server framework
- **NetworkX** - Graph-based routing
- **Groq** - LLM and vision models

## 📄 License

MIT License - see main project for details

## 🔗 Links

- [MCP Documentation](https://modelcontextprotocol.io)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [Groq Console](https://console.groq.com)
- [Claude Desktop](https://claude.ai/download)

---

**Built with ❤️ for accessible campus navigation**
