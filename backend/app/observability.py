"""Lightweight observability: structured JSON request logs with timing.

Kept dependency-free (stdlib logging) so it runs anywhere; the structured
output is OpenTelemetry-friendly and can be shipped to a collector later.
"""
from __future__ import annotations

import json
import logging
import time
from contextlib import contextmanager

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("campusiq")


def log_event(event: str, **fields) -> None:
    logger.info(json.dumps({"event": event, **fields}, default=str))


@contextmanager
def timed(event: str, **fields):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        log_event(event, elapsed_ms=elapsed_ms, **fields)
