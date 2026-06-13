"""CampusIQ FastAPI backend.

Exposes the endpoints the Expo app's services/api.ts already expects:
  POST /api/chat
  GET  /api/buildings
  GET  /api/buildings/{id}
  POST /api/routes/calculate
  GET  /health
"""
from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import os
import time
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import agent
from .data import all_buildings, get_building
from .observability import log_event
from .routing import calculate_route
from .vision import locate_from_image

app = FastAPI(title="CampusIQ Navigation API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    log_event(
        "http_request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        elapsed_ms=elapsed_ms,
    )
    return response


class ChatRequest(BaseModel):
    session_id: str
    message: str
    device_id: Optional[str] = None
    accessibility_profile: Optional[dict[str, bool]] = None


class RouteRequest(BaseModel):
    from_id: str
    to_id: str
    wheelchair: bool = False
    avoid_stairs: bool = False
    elevator_required: bool = False


class VisionRequest(BaseModel):
    image: str  # data URL or base64-encoded image


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", **agent.health_info()}


@app.get("/api/buildings")
def get_buildings() -> list[dict[str, Any]]:
    return all_buildings()


@app.get("/api/buildings/{building_id}")
def get_building_by_id(building_id: str) -> dict[str, Any]:
    b = get_building(building_id)
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    return b


@app.post("/api/chat")
def chat(req: ChatRequest) -> dict[str, Any]:
    profile = req.accessibility_profile or {}
    return agent.respond(req.message, req.session_id, profile)


@app.post("/api/routes/calculate")
def routes_calculate(req: RouteRequest) -> dict[str, Any]:
    profile = {
        "wheelchair": req.wheelchair,
        "avoid_stairs": req.avoid_stairs,
        "elevator_required": req.elevator_required,
    }
    route_type = "accessible" if any(profile.values()) else "fastest"
    route = calculate_route(req.from_id, req.to_id, route_type, profile)
    if not route:
        raise HTTPException(status_code=404, detail="No route found")
    return route


@app.post("/api/vision/locate")
def vision_locate(req: VisionRequest) -> dict[str, Any]:
    image = req.image if req.image.startswith("data:") else f"data:image/jpeg;base64,{req.image}"
    return locate_from_image(image)
