from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import queries
from ..db import run_query
from ..schemas import RecommendRolesRequest

router = APIRouter(prefix="/api/roles", tags=["roles"])


@router.get("")
def list_roles():
    return run_query(queries.LIST_ROLES)


@router.get("/{role_id}")
def get_role(role_id: str):
    rows = run_query(queries.GET_ROLE, {"role_id": role_id})
    if not rows or rows[0]["title"] is None:
        raise HTTPException(status_code=404, detail="Role not found")
    row = rows[0]
    row["required_skills"] = [s for s in row["required_skills"] if s.get("skill_id")]
    return row


@router.post("/recommend")
def recommend_roles(body: RecommendRolesRequest):
    return run_query(queries.RECOMMEND_ROLES, {"known_skill_ids": body.known_skill_ids})
