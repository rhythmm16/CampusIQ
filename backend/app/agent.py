"""Conversational navigation agent.

Uses Groq Cloud (OpenAI-compatible API) by default, with fallbacks to Azure /
OpenAI. When no credentials are configured, runs a deterministic local agent.
"""
from __future__ import annotations

import json
import os
from typing import Any

from .observability import log_event
from .tools import (
    ORIGIN_DEFAULT,
    calculate_route_tool,
    find_building,
    get_events,
    get_hours,
    get_pulse,
    get_safety_pois,
    get_weather_hint,
)

SYSTEM_PROMPT = """You are CampusIQ, a campus navigation assistant for an award-winning accessible campus navigation system.

CORE CAPABILITIES:
1. **Find destinations**: Use find_building to resolve ANY place name the user mentions
2. **Check accessibility**: ALWAYS respect wheelchair, elevator, avoid_stairs, and other accessibility needs
3. **Check weather**: Call get_weather_hint to fetch real-time weather (rain/heat) and recommend covered routes
4. **Check events & crowding**: Call get_pulse to see cafeteria queues, parking availability, and get_events for blocked paths
5. **Calculate routes**: Use calculate_route with the user's profile to get fastest/accessible/quiet/weather_shielded/scenic options
6. **Voice guidance ready**: Your responses will be read aloud via text-to-speech in multiple languages

CRITICAL WORKFLOW FOR ROUTING:
When user asks for directions, you MUST follow this exact order:
1. Call find_building(user's destination) → returns {"match": {"building_id": "cafeteria", "name": "..."}}
2. Extract the building_id from the match result
3. Call calculate_route(from_id="main_gate", to_id="cafeteria") using the ACTUAL building_id
4. NEVER pass literal text like "Central Cafeteria" or "current location" to calculate_route - ONLY building_ids!

WORKFLOW FOR COMPLEX QUERIES (e.g. "wheelchair + rain + destination"):
1. Call find_building(destination)
2. Call get_weather_hint() - ALWAYS call this to check current conditions (it's a free API, no cost)
3. Call get_pulse() if user mentions crowds/queues/parking OR if weather data suggests high campus activity
4. Call calculate_route(from_id="main_gate", to_id=<building_id from step 1>) - USE BUILDING_ID NOT NAME!
5. Explain the route choice clearly: "It's raining (25°C), so I've selected a step-free, covered route for your wheelchair access needs"

CRITICAL RULES:
- NEVER invent buildings, hours, or directions - use tools ONLY
- ALWAYS use building_id (like "cafeteria", "library", "main_gate") in calculate_route, NEVER use building names
- If wheelchair=true OR avoid_stairs=true OR elevator_required=true → MUST use accessible routes (no stairs)
- If path blocked by event → surface alternate-route note from route warnings
- If weather API returns is_raining=true OR is_hot=true → mention weather in response and recommend weather_shielded route
- If crowd/queue data available → mention it in route explanation
- Be concise, friendly, and always offer "Want to see this on the map?"
- PROACTIVELY call get_weather_hint() on every route request to provide context-aware navigation

You handle REAL accessibility needs for REAL users. Accuracy and safety matter."""

TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "find_building",
            "description": "Resolve a free-text place name to a campus building.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_route",
            "description": "Compute fastest/accessible/quiet/weather-shielded/scenic routes to a building_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to_id": {"type": "string"},
                    "from_id": {"type": "string"},
                },
                "required": ["to_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_hours",
            "description": "Get operating hours / open-now status for a building_id.",
            "parameters": {
                "type": "object",
                "properties": {"building_id": {"type": "string"}},
                "required": ["building_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_pulse",
            "description": "Live campus pulse: cafeteria queues, library seats, parking availability.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_safety_pois",
            "description": "Emergency exits, AED stations, and assembly points on campus.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather_hint",
            "description": "Fetch real-time weather (temperature, rain status) from Open-Meteo API. Returns is_raining, is_hot, temperature_c, and routing recommendations. Call this for EVERY route request to provide weather-aware navigation.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_events",
            "description": "Get today's campus events and which paths are blocked by events/crowds.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def _profile_needs_accessible(profile: dict[str, bool]) -> bool:
    return bool(
        profile.get("wheelchair")
        or profile.get("avoid_stairs")
        or profile.get("elevator_required")
    )


def _dispatch_tool(name: str, args: dict[str, Any], profile: dict[str, bool]) -> dict[str, Any]:
    log_event("tool_call", tool=name, args=args)
    if name == "find_building":
        return find_building(args.get("query", ""))
    if name == "calculate_route":
        return calculate_route_tool(
            to_id=args["to_id"],
            profile=profile,
            from_id=args.get("from_id", ORIGIN_DEFAULT),
        )
    if name == "get_hours":
        return get_hours(args["building_id"])
    if name == "get_events":
        return get_events()
    if name == "get_pulse":
        return get_pulse()
    if name == "get_safety_pois":
        return get_safety_pois()
    if name == "get_weather_hint":
        return get_weather_hint()
    return {"error": f"unknown tool {name}"}


class Agent:
    def __init__(self) -> None:
        self.provider = "none"
        self.model = ""
        self.vision_model = ""
        self._client = None
        # Store conversation history per session (max 10 messages to avoid token limits)
        self._conversations: dict[str, list[dict[str, str]]] = {}
        self._init_llm()

    def _init_llm(self) -> None:
        groq_key = os.getenv("GROQ_API_KEY")
        azure_key = os.getenv("AZURE_OPENAI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

        try:
            if groq_key:
                from openai import OpenAI

                self._client = OpenAI(
                    api_key=groq_key,
                    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
                )
                self.provider = "groq"
                self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
                self.vision_model = os.getenv(
                    "GROQ_VISION_MODEL", "llama-3.2-90b-vision-preview"
                )
                return

            if azure_key and azure_endpoint:
                from openai import AzureOpenAI

                self._client = AzureOpenAI(
                    api_key=azure_key,
                    azure_endpoint=azure_endpoint,
                    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
                )
                self.provider = "azure"
                self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                self.vision_model = os.getenv("OPENAI_VISION_MODEL", self.model)
                return

            if openai_key:
                from openai import OpenAI

                self._client = OpenAI(api_key=openai_key)
                self.provider = "openai"
                self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                self.vision_model = os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini")
        except Exception as exc:
            print(f"[agent] Failed to initialize LLM client: {exc}")
            self._client = None
            self.provider = "none"

    @property
    def uses_llm(self) -> bool:
        return self._client is not None

    def health_info(self) -> dict[str, Any]:
        return {
            "llm": self.uses_llm,
            "provider": self.provider,
            "model": self.model if self.uses_llm else None,
            "vision_model": self.vision_model if self.uses_llm else None,
        }

    def respond(
        self, message: str, session_id: str, profile: dict[str, bool]
    ) -> dict[str, Any]:
        if self._client is None:
            return _fallback_respond(message, session_id, profile)
        try:
            return self._llm_respond(message, session_id, profile)
        except Exception as exc:  # pragma: no cover
            log_event("llm_error", error=str(exc), provider=self.provider)
            print(f"[agent] LLM error, falling back: {exc}")
            return _fallback_respond(message, session_id, profile)

    def _llm_respond(
        self, message: str, session_id: str, profile: dict[str, bool]
    ) -> dict[str, Any]:
        # Initialize conversation history for new sessions
        if session_id not in self._conversations:
            self._conversations[session_id] = []
        
        # Build messages with conversation history
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"User accessibility profile: {json.dumps(profile)}"},
        ]
        
        # Add conversation history (last 10 messages to avoid token limits)
        messages.extend(self._conversations[session_id][-10:])
        
        # Add current user message
        messages.append({"role": "user", "content": message})

        collected_route: dict[str, Any] | None = None
        highlights: list[str] = []

        for _ in range(5):
            completion = self._client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOLS_SPEC,
                tool_choice="auto",
                temperature=0.2,
            )
            choice = completion.choices[0].message
            if not choice.tool_calls:
                assistant_response = choice.content or "How can I help you navigate campus?"
                
                # Store conversation history
                self._conversations[session_id].append({"role": "user", "content": message})
                self._conversations[session_id].append({"role": "assistant", "content": assistant_response})
                
                # Keep only last 20 messages (10 exchanges)
                if len(self._conversations[session_id]) > 20:
                    self._conversations[session_id] = self._conversations[session_id][-20:]
                
                return {
                    "response": assistant_response,
                    "route_data": collected_route,
                    "buildings_to_highlight": highlights,
                    "session_id": session_id,
                    "has_route": collected_route is not None,
                }

            messages.append(choice.model_dump(exclude_none=True))
            for call in choice.tool_calls:
                args = json.loads(call.function.arguments or "{}")
                result = _dispatch_tool(call.function.name, args, profile)
                if call.function.name == "calculate_route" and result.get("route_data"):
                    collected_route = result["route_data"]
                if call.function.name == "find_building" and result.get("match"):
                    highlights.append(result["match"]["building_id"])
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.id,
                        "content": json.dumps(result, default=str),
                    }
                )

        return _fallback_respond(message, session_id, profile)


def _fallback_respond(
    message: str, session_id: str, profile: dict[str, bool]
) -> dict[str, Any]:
    """Deterministic agent used when no LLM credentials are available."""
    msg = message.lower()

    if any(k in msg for k in ["event", "happening", "today"]):
        events = get_events()["events"]
        lines = [f"\u2022 {e['title']}" + (f" \u2014 {e['note']}" if e["note"] else "") for e in events]
        return _text_response(
            "Today's campus events:\n\n" + "\n".join(lines), session_id,
            highlights=[e["location"] for e in events if e["location"]],
        )

    found = find_building(message)
    match = found.get("match")

    if any(k in msg for k in ["hour", "open", "close"]) and match:
        h = get_hours(match["building_id"])
        window = f"{h.get('open')}\u2013{h.get('close')}"
        if h.get("open_now") is None:
            text = f"{h['building']} hours are currently unavailable."
        elif h.get("open_now"):
            text = f"{h['building']} is open now ({window})."
        else:
            text = f"{h['building']} is currently closed ({h.get('hours') or window})."
        return _text_response(text, session_id, highlights=[match["building_id"]])

    direction_keywords = [
        "get to", "directions", "way to", "route", "navigate", "reach",
        "take me", "go to", "how do i get",
    ]
    if any(k in msg for k in direction_keywords) and match:
        route = calculate_route_tool(match["building_id"], profile)
        if not route["has_route"]:
            return _text_response(
                f"I couldn't find a route to {match['name']} right now \u2014 a path may be blocked by an event.",
                session_id, highlights=[match["building_id"]],
            )
        needs_acc = _profile_needs_accessible(profile)
        primary = route["route_data"].get("accessible" if needs_acc else "fastest") or route["route_data"].get("fastest")
        text = (
            f"Here's your route to {match['name']}:\n\n"
            f"{match['short_name']} \u2014 {primary['total_distance_meters']}m "
            f"(~{primary['total_walk_time_minutes']} min walk)\n\n"
            + ("I've selected a step-free accessible route for you.\n\n" if needs_acc else "")
            + "Want to see it on the map?"
        )
        return {
            "response": text,
            "route_data": route["route_data"],
            "buildings_to_highlight": [match["building_id"]],
            "session_id": session_id,
            "has_route": True,
        }

    if match:
        return _text_response(
            f"{match['name']} is a {match['category']} facility. "
            f"Services: {', '.join(match.get('services', [])) or 'n/a'}. "
            "Ask me for directions or opening hours.",
            session_id, highlights=[match["building_id"]],
        )

    return _text_response(
        "I can help you navigate campus! Ask about a building, directions, opening hours, or today's events.",
        session_id,
    )


def _text_response(text: str, session_id: str, highlights: list[str] | None = None) -> dict[str, Any]:
    return {
        "response": text,
        "route_data": None,
        "buildings_to_highlight": highlights or [],
        "session_id": session_id,
        "has_route": False,
    }


agent = Agent()
