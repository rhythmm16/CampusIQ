"""Snap & Navigate: identify a campus location from a photo of a landmark.

Uses Groq vision models (OpenAI-compatible) when GROQ_API_KEY is configured.
"""
from __future__ import annotations

import json

from .agent import agent
from .data import all_buildings


def _building_catalog() -> str:
    return "\n".join(
        f"- {b['building_id']}: {b['name']} ({b['category']}) {b.get('marker_emoji', '')}"
        for b in all_buildings()
    )


def locate_from_image(image_data_url: str) -> dict:
    """Returns {building_id, confidence, reason} or {building_id: None, ...}."""
    if not agent.uses_llm or agent._client is None:
        return {
            "building_id": None,
            "confidence": 0.0,
            "reason": "Vision model not configured. Set GROQ_API_KEY to enable Snap & Navigate.",
        }

    system = (
        "You identify which campus building a photo was taken at. "
        "Choose the single best match from this catalog and respond as JSON "
        '{"building_id": "<id or null>", "confidence": 0-1, "reason": "..."}.\n\n'
        + _building_catalog()
    )

    vision_model = agent.vision_model or agent.model

    try:
        completion = agent._client.chat.completions.create(
            model=vision_model,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Where on campus was this taken?"},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                },
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(completion.choices[0].message.content or "{}")
    except Exception as exc:  # pragma: no cover
        return {"building_id": None, "confidence": 0.0, "reason": f"Vision error: {exc}"}
