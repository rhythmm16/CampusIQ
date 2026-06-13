"""Golden-dataset tests for the agent's deterministic (no-LLM) behavior.

These guard building resolution, route generation, and accessibility handling
so prompt/logic changes can't silently regress core navigation answers.
"""
import json
from pathlib import Path

import pytest

from app.agent import _fallback_respond

GOLDEN = json.loads(
    (Path(__file__).resolve().parent.parent / "eval" / "golden.json").read_text()
)
CASES = GOLDEN["cases"]


@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_golden_case(case):
    profile = case.get("profile", {})
    result = _fallback_respond(case["query"], "test-session", profile)

    assert result["session_id"] == "test-session"
    assert isinstance(result["response"], str) and result["response"]

    if "expected_building_id" in case:
        assert case["expected_building_id"] in result["buildings_to_highlight"]

    if case.get("expects_route"):
        assert result["has_route"] is True
        assert result["route_data"] is not None
        primary = result["route_data"].get("fastest") or result["route_data"].get(
            "accessible"
        )
        assert primary is not None
        assert primary["to_building"]["building_id"] == case["expected_building_id"]

        if case.get("expects_step_free"):
            accessible = result["route_data"].get("accessible") or primary
            assert all(s["is_accessible"] for s in accessible["segments"])
    else:
        assert result["has_route"] is False

    if case.get("expects_events"):
        assert "event" in result["response"].lower()
