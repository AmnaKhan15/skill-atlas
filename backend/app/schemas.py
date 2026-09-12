from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Skill(BaseModel):
    skill_id: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None


class Course(BaseModel):
    course_id: str
    title: str
    provider: Optional[str] = None
    level: Optional[str] = None
    duration_hours: Optional[int] = None
    url: Optional[str] = None
    teaches: list[str] = Field(default_factory=list)


class Role(BaseModel):
    role_id: str
    title: str
    industry: Optional[str] = None
    seniority: Optional[str] = None
    description: Optional[str] = None
    skill_count: Optional[int] = None


class RecommendRolesRequest(BaseModel):
    known_skill_ids: list[str] = Field(default_factory=list)


class LearningPathRequest(BaseModel):
    known_skill_ids: list[str] = Field(default_factory=list)
    target_role_id: str
