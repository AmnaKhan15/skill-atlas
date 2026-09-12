from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import queries
from ..db import run_query

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("")
def list_courses():
    return run_query(queries.LIST_COURSES)


@router.get("/{course_id}")
def get_course(course_id: str):
    rows = run_query(queries.GET_COURSE, {"course_id": course_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Course not found")
    return rows[0]


@router.get("/{course_id}/prerequisites")
def course_prerequisites(course_id: str):
    exists = run_query(queries.GET_COURSE, {"course_id": course_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Course not found")
    return run_query(queries.COURSE_PREREQUISITE_CHAIN, {"course_id": course_id})
