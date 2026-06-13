"""CampusIQ MCP Server - Model Context Protocol integration.

Exposes campus navigation tools to any MCP-compatible AI assistant
(ChatGPT, Claude Desktop, IDEs, etc.)

Install:
    pip install fastmcp httpx python-dotenv

Run:
    python mcp_server.py

Usage in Claude Desktop:
    Add to claude_desktop_config.json (Windows):
    %APPDATA%\\Claude\\claude_desktop_config.json
    
    {
      "mcpServers": {
        "campusiq": {
          "command": "python",
          "args": ["C:/Users/LENOVO/Downloads/campusapp/campusapp/backend/mcp_server.py"],
          "env": {
            "GROQ_API_KEY": "your_groq_key_here"
          }
        }
      }
    }

Usage with uvx (recommended):
    {
      "mcpServers": {
        "campusiq": {
          "command": "uvx",
          "args": ["--from", ".", "mcp_server"],
          "cwd": "C:/Users/LENOVO/Downloads/campusapp/campusapp/backend",
          "env": {
            "GROQ_API_KEY": "your_groq_key_here"
          }
        }
      }
    }
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

# Ensure the backend directory is in the Python path
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
from fastmcp import FastMCP

# Import your existing tools and data
from app.tools import (
    ORIGIN_DEFAULT,
    calculate_route_tool,
    find_building,
    get_events,
    get_hours,
    get_pulse,
    get_safety_pois,
    get_weather_hint,
)
from app.vision import locate_from_image
from app.data import all_buildings

# Load environment variables
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Initialize MCP server
mcp = FastMCP("CampusIQ Navigation")


@mcp.tool()
def campus_find_building(query: str) -> dict[str, Any]:
    """Find a campus building by name, ID, or description.
    
    Args:
        query: Natural language query (e.g., "library", "computer science", "cafeteria")
    
    Returns:
        Building information including location, services, and accessibility features
    
    Examples:
        - "Where is the library?"
        - "Find computer science building"
        - "Locate the cafeteria"
    """
    result = find_building(query)
    if result.get("match"):
        building = result["match"]
        return {
            "found": True,
            "building_id": building["building_id"],
            "name": building["name"],
            "short_name": building["short_name"],
            "category": building["category"],
            "services": building.get("services", []),
            "coordinates": building.get("coordinates"),
            "accessibility": {
                "wheelchair_accessible": building.get("accessibility", {}).get("wheelchair_accessible"),
                "elevator": building.get("accessibility", {}).get("elevator"),
                "accessible_entrance": building.get("accessibility", {}).get("accessible_entrance"),
            }
        }
    return {
        "found": False,
        "message": "Building not found",
        "suggestions": result.get("candidates", [])
    }


@mcp.tool()
def campus_calculate_route(
    destination: str,
    origin: str = ORIGIN_DEFAULT,
    wheelchair: bool = False,
    avoid_stairs: bool = False,
    elevator_required: bool = False,
    prefer_scenic: bool = False,
    weather_protected: bool = False
) -> dict[str, Any]:
    """Calculate a route between two campus locations with accessibility options.
    
    Args:
        destination: Building ID or name of destination
        origin: Building ID or name of starting point (default: main_gate)
        wheelchair: Require wheelchair-accessible paths
        avoid_stairs: Avoid routes with stairs
        elevator_required: Only use routes with elevator access
        prefer_scenic: Prefer scenic/quieter paths when available
        weather_protected: Prefer covered/indoor paths
    
    Returns:
        Route options with distances, walking times, and turn-by-turn directions
    
    Examples:
        - Calculate accessible route to library from main gate
        - Find scenic path to student center
        - Get weather-protected route to engineering building
    """
    # Resolve building names to IDs
    dest_result = find_building(destination)
    if not dest_result.get("match"):
        return {"error": f"Destination '{destination}' not found"}
    
    dest_id = dest_result["match"]["building_id"]
    
    origin_id = origin
    if origin != ORIGIN_DEFAULT:
        origin_result = find_building(origin)
        if not origin_result.get("match"):
            return {"error": f"Origin '{origin}' not found"}
        origin_id = origin_result["match"]["building_id"]
    
    # Build accessibility profile
    profile = {
        "wheelchair": wheelchair,
        "avoid_stairs": avoid_stairs,
        "elevator_required": elevator_required,
        "prefer_scenic": prefer_scenic,
        "weather_protected": weather_protected,
    }
    
    result = calculate_route_tool(to_id=dest_id, from_id=origin_id, profile=profile)
    
    if not result["has_route"]:
        return {
            "error": "No route found",
            "message": "Path may be blocked by an event or accessibility constraints cannot be met"
        }
    
    return {
        "success": True,
        "from": origin_id,
        "to": dest_id,
        "routes": result["route_data"],
        "accessibility_applied": any([wheelchair, avoid_stairs, elevator_required])
    }


@mcp.tool()
def campus_building_hours(building: str) -> dict[str, Any]:
    """Get operating hours and current open/closed status for a campus building.
    
    Args:
        building: Building name or ID
    
    Returns:
        Operating hours, current status, and opening/closing times
    
    Examples:
        - "Is the library open now?"
        - "What time does the cafeteria close?"
        - "When does the gym open tomorrow?"
    """
    result = find_building(building)
    if not result.get("match"):
        return {"error": f"Building '{building}' not found"}
    
    building_id = result["match"]["building_id"]
    hours = get_hours(building_id)
    
    return hours


@mcp.tool()
def campus_live_pulse() -> dict[str, Any]:
    """Get real-time campus status: cafeteria queues, library seats, parking availability.
    
    Returns:
        Live status indicators for key campus facilities
    
    Examples:
        - "How busy is the cafeteria?"
        - "Are there parking spots available?"
        - "Is the library crowded?"
    """
    return get_pulse()


@mcp.tool()
def campus_safety_pois() -> dict[str, Any]:
    """Get emergency safety points: exits, AED stations, assembly points.
    
    Returns:
        List of all emergency and safety points of interest on campus
    
    Examples:
        - "Where are the emergency exits?"
        - "Find nearest AED station"
        - "Show assembly points"
    """
    return get_safety_pois()


@mcp.tool()
def campus_events() -> dict[str, Any]:
    """Get current campus events and their impact on navigation.
    
    Returns:
        Active events, locations, and alternate route suggestions if paths are blocked
    
    Examples:
        - "What events are happening today?"
        - "Are any paths blocked?"
        - "Show me today's campus activities"
    """
    return get_events()


@mcp.tool()
def campus_weather_routing() -> dict[str, Any]:
    """Get weather-aware routing recommendations.
    
    Returns:
        Information about weather-protected route options
    
    Examples:
        - "What about weather-protected routes?"
        - "How do I avoid rain?"
    """
    return get_weather_hint()


@mcp.tool()
def campus_identify_building_from_photo(image_data: str) -> dict[str, Any]:
    """Identify a campus building from a photo (Snap & Navigate feature).
    
    Args:
        image_data: Base64-encoded image or data URL
    
    Returns:
        Identified building, confidence score, and location information
    
    Note:
        Requires GROQ_VISION_MODEL to be configured with an API key
    
    Examples:
        - "What building is this?" (with photo)
        - "Where am I?" (with campus photo)
    """
    # Ensure data URL format
    if not image_data.startswith("data:"):
        image_data = f"data:image/jpeg;base64,{image_data}"
    
    result = locate_from_image(image_data)
    return result


# Add a resource for campus metadata
@mcp.resource("campus://info")
def get_campus_info() -> str:
    """Get general campus information and capabilities."""
    buildings = all_buildings()
    building_count = len(buildings)
    categories = set(b.get("category", "Unknown") for b in buildings)
    
    return f"""CampusIQ Navigation System - MCP Server

📊 Campus Statistics:
- Total Buildings: {building_count}
- Categories: {', '.join(sorted(categories))}
- Graph-based routing with NetworkX

🎯 Capabilities:
- Building search and information lookup
- Accessible route calculation (wheelchair, elevator, step-free)
- Real-time operating hours
- Live campus pulse (crowds, parking, queues)
- Emergency/safety points of interest
- Event notifications and navigation impacts
- Weather-aware routing suggestions
- Photo-based building identification (Snap & Navigate)

♿ Accessibility Features:
- Wheelchair-accessible routing
- Elevator-only paths
- Stair-free routes
- Accessible entrance information
- Sensory-friendly quiet routes

🌟 Special Features:
- Zero-hallucination routing (graph-based, no invented paths)
- Multi-modal: text and image queries
- Event-aware navigation with alternate routes
- Scenic/quiet path preferences
- Weather-protected route options

🔧 Configuration:
- Provider: {os.getenv('GROQ_API_KEY', 'Not configured')[:20]}...
- Vision Model: {os.getenv('GROQ_VISION_MODEL', 'llama-3.2-90b-vision-preview')}
- Base Model: {os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')}

💡 Example Queries:
- "Find the library and show me how to get there"
- "Is the cafeteria open? How crowded is it?"
- "Show me an accessible route to the computer science building"
- "Where are the emergency exits?"
- "What events are happening today that might block my path?"
"""


@mcp.resource("campus://buildings/list")
def list_all_buildings() -> str:
    """Get a formatted list of all campus buildings."""
    buildings = all_buildings()
    
    output = ["# All Campus Buildings\n"]
    
    # Group by category
    by_category: dict[str, list[dict]] = {}
    for b in buildings:
        category = b.get("category", "Other")
        by_category.setdefault(category, []).append(b)
    
    for category in sorted(by_category.keys()):
        output.append(f"\n## {category}\n")
        for b in sorted(by_category[category], key=lambda x: x["name"]):
            services = ", ".join(b.get("services", []))
            wheelchair = "♿" if b.get("accessibility", {}).get("wheelchair_accessible") else ""
            output.append(
                f"- **{b['name']}** ({b['short_name']}) {wheelchair}\n"
                f"  - ID: `{b['building_id']}`\n"
                f"  - Services: {services or 'None'}\n"
            )
    
    return "\n".join(output)


@mcp.prompt()
def navigate_to_building(building_name: str, accessibility_needs: str = "none") -> str:
    """Generate a prompt for navigating to a specific building with accessibility options.
    
    Args:
        building_name: Name or description of the destination building
        accessibility_needs: Comma-separated list (wheelchair, stairs, elevator, scenic, quiet, weather)
    """
    needs_list = [n.strip().lower() for n in accessibility_needs.split(",") if n.strip()]
    
    accessibility_flags = {
        "wheelchair": "wheelchair" in needs_list,
        "avoid_stairs": "stairs" in needs_list or "wheelchair" in needs_list,
        "elevator_required": "elevator" in needs_list,
        "prefer_scenic": "scenic" in needs_list,
        "weather_protected": "weather" in needs_list or "rain" in needs_list,
    }
    
    active_flags = [k for k, v in accessibility_flags.items() if v]
    flags_text = ", ".join(active_flags) if active_flags else "standard routing"
    
    return f"""Please help me navigate to {building_name} on campus.

Accessibility requirements: {flags_text}

Use the campus_find_building tool to locate the building, then campus_calculate_route to get directions.
Include information about:
- Current building hours (campus_building_hours)
- Any crowding or availability (campus_live_pulse if relevant)
- Safety information if it's an emergency (campus_safety_pois)
- Any events that might block the path (campus_events)

Present the route clearly with:
1. Building information and current status
2. Route overview (distance and time)
3. Step-by-step directions
4. Any accessibility notes or warnings
"""


@mcp.prompt()
def emergency_navigation() -> str:
    """Generate a prompt for emergency navigation and safety information."""
    return """I need emergency information and navigation help on campus.

Please provide:
1. All emergency exits, AED stations, and assembly points (campus_safety_pois)
2. Current campus events that might affect evacuation routes (campus_events)
3. The fastest route to the nearest emergency exit from the main gate

Use campus_safety_pois to get all safety points, then help me identify the nearest emergency resources.
Present the information clearly with:
- Map of safety points by building
- Emergency contact information if available
- Clear directions to nearest emergency exit
- Any blocked paths due to events
"""


@mcp.prompt()
def accessibility_audit() -> str:
    """Generate a prompt for auditing campus accessibility features."""
    return """Please provide a comprehensive accessibility audit of the campus.

Use the following tools:
1. campus_find_building (for each major building type) to check accessibility features
2. campus_calculate_route with wheelchair=true to test route connectivity
3. campus_safety_pois to identify accessible emergency exits

Present:
- List of wheelchair-accessible buildings with elevator access
- Buildings lacking accessibility features
- Accessible route coverage (can you reach all major buildings?)
- Gaps in accessibility infrastructure
- Recommendations for improvements
"""


def main():
    """Main entry point for the MCP server."""
    # Use stderr for logging to avoid Unicode issues with Claude Desktop
    import sys
    sys.stderr.write("CampusIQ MCP Server Starting...\n")
    sys.stderr.write(f"Backend Directory: {backend_dir}\n")
    sys.stderr.write(f"Groq API Key: {'Configured' if os.getenv('GROQ_API_KEY') else 'Not configured'}\n")
    sys.stderr.write("=" * 60 + "\n")
    sys.stderr.flush()
    
    try:
        mcp.run()
    except KeyboardInterrupt:
        sys.stderr.write("\n\nShutting down CampusIQ MCP Server...\n")
    except Exception as e:
        sys.stderr.write(f"\nError running MCP server: {e}\n")
        import traceback
        traceback.print_exc(file=sys.stderr)
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
