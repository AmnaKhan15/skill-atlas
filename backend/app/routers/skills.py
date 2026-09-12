from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from .. import queries
from ..db import run_query

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("")
def list_skills():
    return run_query(queries.LIST_SKILLS)


@router.get("/{skill_id}")
def get_skill(skill_id: str):
    rows = run_query(queries.GET_SKILL, {"skill_id": skill_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Skill not found")
    return rows[0]


@router.get("/{skill_id}/neighborhood")
def skill_neighborhood(skill_id: str, depth: int = Query(2, ge=1, le=3)):
    """Multi-hop traversal of the RELATED_TO skill graph.

    `depth` controls the variable-length hop range. Cypher does not allow
    a query parameter inside a relationship range (`*1..$depth` is not
    valid openCypher), so the validated integer is formatted into the
    query text -- safe here because it is constrained to 1-3 by the
    `Query(..., ge=1, le=3)` validator above, never raw user text.
    """
    cypher = queries.SKILL_NEIGHBORHOOD % {"depth": depth}
    rows = run_query(cypher, {"skill_id": skill_id})
    if not rows:
        # Distinguish "skill has no neighbors" from "skill doesn't exist"
        exists = run_query(queries.GET_SKILL, {"skill_id": skill_id})
        if not exists:
            raise HTTPException(status_code=404, detail="Skill not found")
    return rows
