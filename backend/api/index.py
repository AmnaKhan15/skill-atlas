"""Vercel serverless entrypoint.

Vercel's Python runtime loads this file and looks for a top-level `app`
(an ASGI application, which FastAPI is). `backend/app` is a regular
package with relative imports (`from .config import settings`, etc.),
so it needs its parent directory (`backend/`) on `sys.path` before it
can be imported here -- this file lives in `backend/api/`, so that
parent is two levels up from `__file__`.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402
