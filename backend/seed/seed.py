#!/usr/bin/env python3
"""Loads the Skill Atlas seed data into CognoDB.

Usage (run from the backend/ directory):
    python seed/seed.py            # merge data in (safe to re-run)
    python seed/seed.py --reset    # delete all nodes/relationships first

Reads connection details from the environment (COGNODB_URI,
COGNODB_USER, COGNODB_PASSWORD, COGNODB_DATABASE), the same variables
the application itself uses. Run this from the `backend/` directory
with a `.env` file present, or with the variables already exported.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seed_data import COURSE_PREREQUISITES, COURSES, ROLES, SKILL_RELATIONSHIPS, SKILLS  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

URI = os.environ.get("COGNODB_URI", "")
USER = os.environ.get("COGNODB_USER", "cognodb")
PASSWORD = os.environ.get("COGNODB_PASSWORD", "")
DATABASE = os.environ.get("COGNODB_DATABASE", "neo4j")


def reset(session) -> None:
    print("Deleting all existing nodes and relationships...")
    session.run("MATCH (n) DETACH DELETE n")


def create_constraints(session) -> None:
    for label, prop in [("Skill", "skill_id"), ("Course", "course_id"), ("Role", "role_id")]:
        session.run(
            f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
        )


def load_skills(session) -> None:
    rows = [
        {"skill_id": s, "name": n, "category": c, "description": d}
        for s, n, c, d in SKILLS
    ]
    session.run(
        """
        UNWIND $rows AS row
        MERGE (s:Skill {skill_id: row.skill_id})
        SET s.name = row.name, s.category = row.category, s.description = row.description
        """,
        rows=rows,
    )
    print(f"Loaded {len(rows)} Skill nodes.")


def load_courses(session) -> None:
    rows = [
        {
            "course_id": cid, "title": title, "provider": provider, "level": level,
            "duration_hours": duration, "url": url,
        }
        for cid, title, provider, level, duration, url, _teaches, _requires in COURSES
    ]
    session.run(
        """
        UNWIND $rows AS row
        MERGE (c:Course {course_id: row.course_id})
        SET c.title = row.title, c.provider = row.provider, c.level = row.level,
            c.duration_hours = row.duration_hours, c.url = row.url
        """,
        rows=rows,
    )
    print(f"Loaded {len(rows)} Course nodes.")

    teaches_rows = [
        {"course_id": cid, "skill_id": skill_id}
        for cid, *_rest, teaches, _requires in COURSES
        for skill_id in teaches
    ]
    session.run(
        """
        UNWIND $rows AS row
        MATCH (c:Course {course_id: row.course_id})
        MATCH (s:Skill {skill_id: row.skill_id})
        MERGE (c)-[:TEACHES]->(s)
        """,
        rows=teaches_rows,
    )
    print(f"Loaded {len(teaches_rows)} TEACHES relationships.")

    requires_rows = [
        {"course_id": cid, "skill_id": skill_id}
        for cid, *_rest, _teaches, requires in COURSES
        for skill_id in requires
    ]
    session.run(
        """
        UNWIND $rows AS row
        MATCH (c:Course {course_id: row.course_id})
        MATCH (s:Skill {skill_id: row.skill_id})
        MERGE (c)-[:REQUIRES]->(s)
        """,
        rows=requires_rows,
    )
    print(f"Loaded {len(requires_rows)} REQUIRES relationships.")

    prereq_rows = [{"before": before, "after": after} for before, after in COURSE_PREREQUISITES]
    session.run(
        """
        UNWIND $rows AS row
        MATCH (before:Course {course_id: row.before})
        MATCH (after:Course {course_id: row.after})
        MERGE (before)-[:PREREQUISITE_OF]->(after)
        """,
        rows=prereq_rows,
    )
    print(f"Loaded {len(prereq_rows)} PREREQUISITE_OF relationships.")


def load_roles(session) -> None:
    rows = [
        {
            "role_id": rid, "title": title, "industry": industry,
            "seniority": seniority, "description": description,
        }
        for rid, title, industry, seniority, description, _reqs in ROLES
    ]
    session.run(
        """
        UNWIND $rows AS row
        MERGE (r:Role {role_id: row.role_id})
        SET r.title = row.title, r.industry = row.industry,
            r.seniority = row.seniority, r.description = row.description
        """,
        rows=rows,
    )
    print(f"Loaded {len(rows)} Role nodes.")

    req_rows = [
        {"role_id": rid, "skill_id": skill_id, "importance": importance, "min_level": min_level}
        for rid, *_rest, requirements in ROLES
        for skill_id, importance, min_level in requirements
    ]
    session.run(
        """
        UNWIND $rows AS row
        MATCH (r:Role {role_id: row.role_id})
        MATCH (s:Skill {skill_id: row.skill_id})
        MERGE (r)-[req:REQUIRES_SKILL]->(s)
        SET req.importance = row.importance, req.min_level = row.min_level
        """,
        rows=req_rows,
    )
    print(f"Loaded {len(req_rows)} REQUIRES_SKILL relationships.")


def load_skill_relationships(session) -> None:
    rows = [
        {"a": a, "b": b, "strength": strength} for a, b, strength in SKILL_RELATIONSHIPS
    ]
    session.run(
        """
        UNWIND $rows AS row
        MATCH (a:Skill {skill_id: row.a})
        MATCH (b:Skill {skill_id: row.b})
        MERGE (a)-[rel:RELATED_TO]-(b)
        SET rel.strength = row.strength
        """,
        rows=rows,
    )
    print(f"Loaded {len(rows)} RELATED_TO relationships.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Delete all data before loading")
    args = parser.parse_args()

    if not URI or not PASSWORD:
        print("COGNODB_URI and COGNODB_PASSWORD must be set (via .env or the environment).")
        sys.exit(1)

    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    try:
        driver.verify_connectivity()
    except Exception as exc:  # noqa: BLE001
        print(f"Could not connect to CognoDB at {URI}: {exc}")
        sys.exit(1)

    with driver.session(database=DATABASE) as session:
        if args.reset:
            reset(session)
        create_constraints(session)
        load_skills(session)
        load_courses(session)
        load_roles(session)
        load_skill_relationships(session)

    driver.close()
    print("Seed complete.")


if __name__ == "__main__":
    main()
