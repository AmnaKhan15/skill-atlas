"""CognoDB (openCypher over Bolt) connection handling.

CognoDB speaks the same Bolt protocol as Neo4j, so the official `neo4j`
Python driver is used as-is -- no custom SDK. The driver keeps its own
internal connection pool, so a single process-wide instance is created
once and reused for every request.
"""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Iterator

from neo4j import GraphDatabase, Driver
from neo4j.exceptions import Neo4jError, ServiceUnavailable, AuthError

from .config import settings

logger = logging.getLogger("skill_atlas.db")

_driver: Driver | None = None


class DatabaseUnavailableError(RuntimeError):
    """Raised whenever CognoDB cannot be reached or a query fails.

    Kept distinct from generic exceptions so the API layer can turn it
    into a clean 503 instead of leaking a driver stack trace.
    """


def init_driver() -> None:
    """Create the driver at startup. Connectivity is *not* required to
    succeed here -- if CognoDB is briefly unreachable when the app boots,
    the app still starts and each request will retry the connection and
    fail gracefully instead of crashing the whole process.
    """
    global _driver
    if not settings.cognodb_uri or not settings.cognodb_password:
        logger.warning(
            "COGNODB_URI / COGNODB_PASSWORD are not set. "
            "The API will start but every query will fail until they are configured."
        )
        return
    _driver = GraphDatabase.driver(
        settings.cognodb_uri,
        auth=(settings.cognodb_user, settings.cognodb_password),
    )
    try:
        _driver.verify_connectivity()
        logger.info("Connected to CognoDB at %s", settings.cognodb_uri)
    except Exception as exc:  # noqa: BLE001 - log and continue, don't crash boot
        logger.warning("CognoDB not reachable at startup: %s", exc)


def close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


@contextmanager
def get_session() -> Iterator[Any]:
    if _driver is None:
        # Normally set by the FastAPI startup event. Falling back to a
        # lazy init here too, since serverless runtimes (Vercel) don't
        # always guarantee a fresh cold start ran that event first.
        init_driver()
    if _driver is None:
        raise DatabaseUnavailableError(
            "No database driver configured. Check COGNODB_URI / COGNODB_PASSWORD."
        )
    try:
        with _driver.session(database=settings.cognodb_database) as session:
            yield session
    except (ServiceUnavailable, AuthError) as exc:
        raise DatabaseUnavailableError(f"CognoDB is unreachable: {exc}") from exc


def run_query(cypher: str, parameters: dict | None = None) -> list[dict]:
    """Run a parameterised Cypher query and return a list of plain dicts.

    Every query in this app goes through here with parameters passed
    separately from the query text -- never string-concatenated -- so
    user input can never be interpreted as Cypher.
    """
    with get_session() as session:
        try:
            result = session.run(cypher, parameters or {})
            return [record.data() for record in result]
        except Neo4jError as exc:
            raise DatabaseUnavailableError(f"Query failed: {exc}") from exc
