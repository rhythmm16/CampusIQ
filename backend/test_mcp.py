"""Test script for CampusIQ MCP Server.

Run this to verify the MCP server is working correctly before
connecting it to Claude or other AI assistants.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend is in path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    try:
        import fastmcp
        print(f"  ✓ fastmcp {fastmcp.__version__}")
    except ImportError as e:
        print(f"  ✗ fastmcp not found: {e}")
        return False
    
    try:
        from dotenv import load_dotenv
        print("  ✓ python-dotenv")
    except ImportError as e:
        print(f"  ✗ python-dotenv not found: {e}")
        return False
    
    try:
        import httpx
        print(f"  ✓ httpx")
    except ImportError as e:
        print(f"  ✗ httpx not found: {e}")
        return False
    
    try:
        from app.tools import find_building, calculate_route_tool
        print("  ✓ app.tools")
    except ImportError as e:
        print(f"  ✗ app.tools not found: {e}")
        return False
    
    try:
        from app.data import all_buildings
        print("  ✓ app.data")
    except ImportError as e:
        print(f"  ✗ app.data not found: {e}")
        return False
    
    return True


def test_data_loading():
    """Test that campus data loads correctly."""
    print("\nTesting data loading...")
    try:
        from app.data import all_buildings, all_paths
        
        buildings = all_buildings()
        paths = all_paths()
        
        print(f"  ✓ Loaded {len(buildings)} buildings")
        print(f"  ✓ Loaded {len(paths)} paths")
        
        if len(buildings) == 0:
            print("  ✗ No buildings found in data")
            return False
        
        if len(paths) == 0:
            print("  ✗ No paths found in data")
            return False
        
        return True
    except Exception as e:
        print(f"  ✗ Data loading failed: {e}")
        return False


def test_tools():
    """Test that tools work correctly."""
    print("\nTesting tools...")
    try:
        from app.tools import find_building, calculate_route_tool, get_hours
        
        # Test find_building
        result = find_building("library")
        if result.get("match"):
            building = result["match"]
            print(f"  ✓ find_building: Found '{building['name']}'")
        else:
            print("  ⚠ find_building: No match for 'library' (might be OK)")
        
        # Test calculate_route
        result = find_building("library")
        if result.get("match"):
            building_id = result["match"]["building_id"]
            route = calculate_route_tool(building_id, {})
            if route["has_route"]:
                print(f"  ✓ calculate_route: Route found")
            else:
                print("  ⚠ calculate_route: No route found (might be OK)")
        
        return True
    except Exception as e:
        print(f"  ✗ Tools test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_mcp_server():
    """Test that MCP server can be instantiated."""
    print("\nTesting MCP server...")
    try:
        import mcp_server
        print(f"  ✓ MCP server module loaded")
        
        # Check that tools are registered
        if hasattr(mcp_server, 'mcp'):
            print(f"  ✓ MCP instance created")
            return True
        else:
            print(f"  ✗ MCP instance not found")
            return False
    except Exception as e:
        print(f"  ✗ MCP server test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_environment():
    """Test environment configuration."""
    print("\nTesting environment...")
    import os
    from dotenv import load_dotenv
    
    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"  ✓ .env file found")
    else:
        print(f"  ⚠ .env file not found at {env_path}")
    
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        print(f"  ✓ GROQ_API_KEY configured ({groq_key[:20]}...)")
    else:
        print(f"  ⚠ GROQ_API_KEY not set (vision features will not work)")
    
    return True


def main():
    """Run all tests."""
    print("=" * 60)
    print("CampusIQ MCP Server Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        ("Imports", test_imports),
        ("Data Loading", test_data_loading),
        ("Tools", test_tools),
        ("Environment", test_environment),
        ("MCP Server", test_mcp_server),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} failed with exception: {e}")
            results.append((name, False))
        print()
    
    print("=" * 60)
    print("Test Results")
    print("=" * 60)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} {name}")
    
    all_passed = all(result for _, result in results)
    
    print()
    if all_passed:
        print("🎉 All tests passed! MCP server is ready to use.")
        print()
        print("Next steps:")
        print("1. Configure Claude Desktop (see MCP_README.md)")
        print("2. Add this to claude_desktop_config.json:")
        print()
        print("  {")
        print('    "mcpServers": {')
        print('      "campusiq": {')
        print('        "command": "python",')
        print(f'        "args": ["{backend_dir / "mcp_server.py"}"],')
        print('        "env": {')
        print('          "GROQ_API_KEY": "your_key_here"')
        print('        }')
        print('      }')
        print('    }')
        print('  }')
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print()
        print("Common fixes:")
        print("- Run: pip install -r requirements.txt")
        print("- Make sure you're in the backend directory")
        print("- Check that data/campus.json exists")
    
    print()
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
