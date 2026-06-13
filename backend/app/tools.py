"""Agent tools. Each tool is a pure function over the campus dataset so the
LLM can ground its answers (zero-hallucination routing) instead of inventing
buildings or directions."""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from .data import active_events, all_buildings, campus_pulse, get_building, safety_pois
from .routing import calculate_route_options

_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

ORIGIN_DEFAULT = "main_gate"

# Common words that should not influence building matching.
_STOPWORDS = {
    "how", "the", "get", "got", "you", "can", "where", "what", "want", "need",
    "that", "this", "near", "from", "for", "and", "way", "route", "directions",
    "take", "going", "navigate", "reach", "show", "find", "please", "hours",
    "open", "close", "closed", "are", "give", "tell", "with", "wheelchair",
    "accessible", "step", "free", "there", "here", "would", "could", "should",
}


def _tokenize(text: str) -> list[str]:
    cleaned = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return [t for t in cleaned.split() if len(t) >= 3 and t not in _STOPWORDS]


def find_building(query: str) -> dict[str, Any]:
    """Resolve a free-text query to the best matching building."""
    q = query.lower().strip()
    buildings = all_buildings()

    for b in buildings:
        if b["building_id"] == q or b["short_name"].lower() == q or b["name"].lower() == q:
            return {"match": b}

    tokens = _tokenize(query)

    scored: list[tuple[int, dict[str, Any]]] = []
    for b in buildings:
        haystack_tokens = set(
            _tokenize(
                " ".join(
                    [b["name"], b["short_name"], b["category"], " ".join(b.get("services", []))]
                )
            )
        )
        # Also allow matching on the building_id segments (e.g. "cs" in "cs_block").
        haystack_tokens.update(_tokenize(b["building_id"].replace("_", " ")))
        score = sum(1 for token in tokens if token in haystack_tokens)
        if score:
            scored.append((score, b))

    if not scored:
        return {"match": None, "candidates": [b["short_name"] for b in buildings[:8]]}

    scored.sort(key=lambda x: x[0], reverse=True)
    return {"match": scored[0][1]}


def calculate_route_tool(
    to_id: str,
    profile: dict[str, bool] | None = None,
    from_id: str = ORIGIN_DEFAULT,
) -> dict[str, Any]:
    profile = profile or {}
    options = calculate_route_options(from_id, to_id, profile)
    has_route = any(options.values())
    return {"has_route": has_route, "route_data": options if has_route else None}


def get_hours(building_id: str, when: datetime | None = None) -> dict[str, Any]:
    b = get_building(building_id)
    if not b:
        return {"error": "unknown building"}
    when = when or datetime.now()
    day = _DAYS[when.weekday()]
    hours = b.get("operating_hours", {}).get(day)
    if not hours:
        return {"building": b["name"], "hours": "unknown"}
    if hours.get("is_closed"):
        return {"building": b["name"], "open_now": False, "hours": "Closed today"}

    now_minutes = when.hour * 60 + when.minute
    open_m = _to_minutes(hours["open"])
    close_m = _to_minutes(hours["close"])
    open_now = open_m <= now_minutes <= close_m
    return {
        "building": b["name"],
        "open": hours["open"],
        "close": hours["close"],
        "open_now": open_now,
    }


def get_events() -> dict[str, Any]:
    events = active_events()
    return {
        "events": [
            {
                "title": e["title"],
                "location": e.get("building_id"),
                "affects_navigation": e.get("affects_navigation", False),
                "note": e.get("alternate_route_note"),
            }
            for e in events
        ]
    }


def get_pulse() -> dict[str, Any]:
    return {
        "pulse": [
            {
                "building_id": p["building_id"],
                "label": p["label"],
                "status": p["status"],
                "detail": p.get("detail"),
            }
            for p in campus_pulse()
        ]
    }


def get_weather_hint() -> dict[str, Any]:
    """Fetch real-time weather from Open-Meteo API (no API key needed)."""
    try:
        import httpx
        from .data import all_buildings
        
        # Get campus center coordinates (use first building as fallback)
        buildings = all_buildings()
        if buildings:
            lat = buildings[0]["coordinates"]["lat"]
            lng = buildings[0]["coordinates"]["lng"]
        else:
            lat, lng = 30.5156, 76.6596  # Chitkara University Rajpura campus center
        
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,precipitation,weather_code"
        )
        
        with httpx.Client(timeout=5.0) as client:
            response = client.get(url)
            data = response.json()
        
        temp = data.get("current", {}).get("temperature_2m", 28)
        precip = data.get("current", {}).get("precipitation", 0)
        code = data.get("current", {}).get("weather_code", 0)
        
        # Weather codes for rain: 51,53,55,61,63,65,80,81,82,95,96,99
        rain_codes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]
        is_raining = precip > 0 or code in rain_codes
        is_hot = temp >= 38
        is_bad = is_raining or is_hot
        
        if is_raining:
            hint = f"It's currently raining ({int(temp)}°C). I recommend weather-shielded routes with covered walkways."
        elif is_hot:
            hint = f"It's very hot ({int(temp)}°C). I recommend shaded or covered paths."
        else:
            hint = f"Weather is clear ({int(temp)}°C). All route options available."
        
        return {
            "is_bad_weather": is_bad,
            "is_raining": is_raining,
            "is_hot": is_hot,
            "temperature_c": int(temp),
            "hint": hint,
            "weather_shielded_available": True,
            "recommend_covered_route": is_bad,
        }
    except Exception as e:
        # Fallback if API fails
        return {
            "is_bad_weather": False,
            "is_raining": False,
            "is_hot": False,
            "temperature_c": 28,
            "hint": "Weather data unavailable. Weather-shielded routes available on request.",
            "weather_shielded_available": True,
            "recommend_covered_route": False,
            "error": str(e),
        }


def get_safety_pois() -> dict[str, Any]:
    return {
        "pois": [
            {
                "id": p["id"],
                "type": p["type"],
                "name": p["name"],
                "building_id": p["building_id"],
            }
            for p in safety_pois()
        ]
    }


def _to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)
