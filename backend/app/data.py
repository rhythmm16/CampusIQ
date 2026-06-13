"""Loads the shared campus dataset (exported from the TS constants)."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "campus.json"


@lru_cache(maxsize=1)
def load_campus() -> dict[str, Any]:
    with DATA_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def buildings_by_id() -> dict[str, dict[str, Any]]:
    return {b["building_id"]: b for b in load_campus()["buildings"]}


def get_building(building_id: str) -> dict[str, Any] | None:
    return buildings_by_id().get(building_id)


def all_buildings() -> list[dict[str, Any]]:
    return load_campus()["buildings"]


def all_paths() -> list[dict[str, Any]]:
    return load_campus()["paths"]


def active_events() -> list[dict[str, Any]]:
    return [e for e in load_campus()["events"] if e.get("is_active")]


def path_attributes() -> dict[str, Any]:
    return load_campus().get("path_attributes", {})


def campus_pulse() -> list[dict[str, Any]]:
    return load_campus().get("campus_pulse", [])


def safety_pois() -> list[dict[str, Any]]:
    return load_campus().get("safety_pois", [])


def get_path_attr(from_id: str, to_id: str) -> dict[str, Any]:
    attrs = path_attributes()
    return (
        attrs.get(f"{from_id}-{to_id}")
        or attrs.get(f"{to_id}-{from_id}")
        or {"noise_level": 3, "is_covered": False, "is_indoor": False}
    )
