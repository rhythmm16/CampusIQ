"""Graph-based campus routing with accessibility-aware edge costs.

Mirrors the client-side engine in services/routing.ts but uses NetworkX, as
described in the CampusIQ architecture (NetworkX route engine).
"""
from __future__ import annotations

import heapq
from typing import Any, Literal

try:  # NetworkX is the primary engine; a pure-Python fallback keeps it runnable anywhere.
    import networkx as nx

    HAS_NETWORKX = True
except ImportError:  # pragma: no cover
    nx = None  # type: ignore
    HAS_NETWORKX = False

from .data import active_events, all_paths, campus_pulse, get_building, get_path_attr, safety_pois

RouteType = Literal["fastest", "accessible", "scenic", "quiet", "weather_shielded"]

BASE_WALK_SPEED = 80  # meters / minute


def _path_id(a: str, b: str) -> str:
    return f"{a}-{b}"


# Adjacency list used for the pure-Python fallback and for edge-data lookups.
def _build_adjacency() -> dict[str, list[dict[str, Any]]]:
    adj: dict[str, list[dict[str, Any]]] = {}

    def add(frm: str, to: str, p: dict[str, Any]) -> None:
        adj.setdefault(frm, []).append(
            {
                "to": to,
                "path_id": _path_id(frm, to),
                "distance": p["distance"],
                "walk_time": p["walk_time"],
                "is_accessible": p["is_accessible"],
                "has_stairs": p["has_stairs"],
            }
        )

    for p in all_paths():
        attr = get_path_attr(p["from"], p["to"])
        extra = {
            "noise_level": attr.get("noise_level", 3),
            "is_covered": attr.get("is_covered", False),
            "is_indoor": attr.get("is_indoor", False),
        }
        add(p["from"], p["to"], {**p, **extra})
        add(p["to"], p["from"], {**p, **extra})
    return adj


_ADJ = _build_adjacency()


def build_graph():
    """Bidirectional directed graph so traversal works both ways."""
    if not HAS_NETWORKX:
        return None
    g = nx.DiGraph()
    for node, edges in _ADJ.items():
        for e in edges:
            g.add_edge(
                node,
                e["to"],
                path_id=e["path_id"],
                distance=e["distance"],
                walk_time=e["walk_time"],
                is_accessible=e["is_accessible"],
                has_stairs=e["has_stairs"],
            )
    return g


_GRAPH = build_graph()


def _dijkstra_fallback(from_id, to_id, weight):
    """Pure-Python Dijkstra used when NetworkX is unavailable."""
    dist = {from_id: 0.0}
    prev: dict[str, str] = {}
    pq: list[tuple[float, str]] = [(0.0, from_id)]
    visited: set[str] = set()

    while pq:
        d, node = heapq.heappop(pq)
        if node in visited:
            continue
        visited.add(node)
        if node == to_id:
            break
        for e in _ADJ.get(node, []):
            cost = weight(node, e["to"], e)
            if cost is None:
                continue
            nd = d + cost
            if nd < dist.get(e["to"], float("inf")):
                dist[e["to"]] = nd
                prev[e["to"]] = node
                heapq.heappush(pq, (nd, e["to"]))

    if to_id not in dist:
        return None
    path = [to_id]
    while path[-1] != from_id:
        if path[-1] not in prev:
            return None
        path.append(prev[path[-1]])
    path.reverse()
    return path


def _edge_data(u: str, v: str) -> dict[str, Any]:
    for e in _ADJ.get(u, []):
        if e["to"] == v:
            return e
    return {}


def blocked_path_ids() -> set[str]:
    blocked: set[str] = set()
    for event in active_events():
        if not event.get("affects_navigation"):
            continue
        for bp in event.get("blocked_paths", []) or []:
            blocked.add(bp)
            parts = bp.split("-")
            if len(parts) == 2:
                blocked.add(_path_id(parts[0], parts[1]))
                blocked.add(_path_id(parts[1], parts[0]))
    return blocked


def _needs_step_free(profile: dict[str, bool]) -> bool:
    return bool(
        profile.get("wheelchair")
        or profile.get("elevator_required")
        or profile.get("avoid_stairs")
    )


def _edge_cost(
    data: dict[str, Any],
    route_type: RouteType,
    profile: dict[str, bool],
    blocked: set[str],
) -> float:
    if data["path_id"] in blocked:
        return float("inf")

    must_be_step_free = route_type in ("accessible", "quiet", "weather_shielded") or _needs_step_free(profile)
    if must_be_step_free and (data["has_stairs"] or not data["is_accessible"]):
        return float("inf")

    cost = float(data["distance"])
    if route_type == "scenic":
        if data["has_stairs"]:
            cost += 250
        if not data["is_accessible"]:
            cost += 150
    elif route_type == "quiet" or profile.get("sensory_friendly"):
        cost += data.get("noise_level", 3) * 35
    elif route_type == "weather_shielded":
        if not data.get("is_covered") and not data.get("is_indoor"):
            cost += 180
    return cost


def _pace_multiplier(profile: dict[str, bool]) -> float:
    if profile.get("slow_walker"):
        return 1.4
    if profile.get("wheelchair"):
        return 1.15
    return 1.0


def calculate_route(
    from_id: str,
    to_id: str,
    route_type: RouteType,
    profile: dict[str, bool],
) -> dict[str, Any] | None:
    from_building = get_building(from_id)
    to_building = get_building(to_id)
    if not from_building or not to_building:
        return None
    if from_id not in _ADJ:
        return None

    blocked = blocked_path_ids()

    def weight(u: str, v: str, data: dict[str, Any]) -> float | None:
        cost = _edge_cost(data, route_type, profile, blocked)
        return None if cost == float("inf") else cost

    if HAS_NETWORKX:
        try:
            node_path = nx.dijkstra_path(_GRAPH, from_id, to_id, weight=weight)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None
    else:
        node_path = _dijkstra_fallback(from_id, to_id, weight)
        if node_path is None:
            return None

    segments: list[dict[str, Any]] = []
    total_distance = 0
    raw_walk_time = 0
    for u, v in zip(node_path, node_path[1:]):
        d = _edge_data(u, v)
        total_distance += d["distance"]
        raw_walk_time += d["walk_time"]
        segments.append(
            {
                "from": u,
                "to": v,
                "distance_meters": d["distance"],
                "walk_time_minutes": d["walk_time"],
                "path_type": "footpath" if d["has_stairs"] else "main_road",
                "is_accessible": d["is_accessible"] and not d["has_stairs"],
                "notes": "Contains stairs" if d["has_stairs"] else None,
            }
        )

    total_walk_time = max(1, round(raw_walk_time * _pace_multiplier(profile)))
    waypoints = [get_building(n)["coordinates"] for n in node_path if get_building(n)]

    steps = _build_steps(node_path, route_type)
    warnings = _event_warnings() if blocked else None

    return {
        "route_type": route_type,
        "from_building": from_building,
        "to_building": to_building,
        "steps": steps,
        "segments": segments,
        "waypoints": waypoints,
        "total_distance_meters": total_distance,
        "total_walk_time_minutes": total_walk_time,
        "accessibility_notes": _accessibility_notes(route_type, profile),
        "event_warnings": warnings,
    }


def calculate_route_options(
    from_id: str, to_id: str, profile: dict[str, bool]
) -> dict[str, Any]:
    return {
        "fastest": calculate_route(from_id, to_id, "fastest", profile),
        "accessible": calculate_route(from_id, to_id, "accessible", profile),
        "scenic": calculate_route(from_id, to_id, "scenic", profile),
        "quiet": calculate_route(from_id, to_id, "quiet", profile),
        "weather_shielded": calculate_route(from_id, to_id, "weather_shielded", profile),
    }


def _build_steps(node_path: list[str], route_type: RouteType) -> list[str]:
    if not node_path:
        return []
    start = get_building(node_path[0])
    steps = [f"Start at {start['name'] if start else node_path[0]}"]
    for i in range(1, len(node_path)):
        b = get_building(node_path[i])
        is_last = i == len(node_path) - 1
        if is_last:
            full = b["name"] if b else node_path[i]
            if route_type == "accessible":
                steps.append(f"Arrive at {full} via the accessible entrance")
            else:
                steps.append(f"Arrive at {full}")
        else:
            name = b["short_name"] if b else node_path[i]
            steps.append(f"Continue past {name}")
    return steps


def _accessibility_notes(route_type: RouteType, profile: dict[str, bool]) -> str | None:
    if route_type == "quiet" or profile.get("sensory_friendly"):
        return "Sensory-quiet route. Avoids noisy cafeterias, crowded plazas, and high-traffic zones."
    if route_type == "weather_shielded":
        return "Weather-shielded route. Maximizes covered walkways and indoor corridors."
    if route_type == "accessible" or _needs_step_free(profile):
        return "Step-free route. Stairs avoided; ramps and elevators used where needed."
    if route_type == "scenic":
        return "Gentle route favoring step-free, pleasant walkways."
    return None


def _event_warnings() -> list[str]:
    return [
        e["alternate_route_note"]
        for e in active_events()
        if e.get("affects_navigation") and e.get("alternate_route_note")
    ]
