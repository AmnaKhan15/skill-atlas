from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import DatabaseUnavailableError, close_driver, init_driver, run_query
from .routers import courses, paths, roles, skills

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Skill Atlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DatabaseUnavailableError)
async def db_unavailable_handler(request: Request, exc: DatabaseUnavailableError):
    logging.getLogger("skill_atlas").error("Database error: %s", exc)
    return JSONResponse(
        status_code=503,
        content={
            "detail": "The graph database is unreachable right now. Please try again shortly."
        },
    )


@app.on_event("startup")
def _startup() -> None:
    init_driver()


@app.on_event("shutdown")
def _shutdown() -> None:
    close_driver()


@app.get("/api/health")
def health():
    try:
        run_query("RETURN 1 AS ok")
        return {"status": "ok", "database": "connected"}
    except DatabaseUnavailableError:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "unreachable"},
        )


app.include_router(skills.router)
app.include_router(courses.router)
app.include_router(roles.router)
app.include_router(paths.router)

# --- Serve the built React frontend (single-service deploy) ---------------
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        """Any non-API route serves the SPA shell so client-side routing
        (e.g. /roles/backend-engineer) works on a hard refresh.

        index.html is served with no-cache: it's tiny, referenced by
        every route, and its whole job is to point at the *current*
        hashed asset bundle. Letting a browser cache it stale is what
        makes a redeploy look like it "didn't take" -- the hashed files
        under /assets are what should be cached hard, since their
        filename itself changes whenever their content does.
        """
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html", headers={"Cache-Control": "no-cache"})
