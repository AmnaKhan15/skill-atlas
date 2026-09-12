"""Every Cypher statement the app runs, kept in one place so the data
model and query design can be read start to finish without hunting
through route handlers. All statements are parameterised -- values are
always passed via the `parameters` dict, never interpolated into the
query string.
"""

# ---------------------------------------------------------------------------
# Skills
# ---------------------------------------------------------------------------

LIST_SKILLS = """
MATCH (s:Skill)
RETURN s.skill_id AS skill_id, s.name AS name, s.category AS category,
       s.description AS description
ORDER BY s.category, s.name
"""

# Multi-hop traversal (2+ hops): walk the RELATED_TO skill graph outward
# from a starting skill up to `depth` hops, and for every skill reached
# along the way, pull in the courses that teach it. A relational schema
# would need a separate self-join per hop (or a recursive CTE) to do
# this; here it's one variable-length pattern.
SKILL_NEIGHBORHOOD = """
MATCH (origin:Skill {skill_id: $skill_id})
CALL {
    WITH origin
    MATCH path = (origin)-[:RELATED_TO*1..%(depth)s]-(related:Skill)
    RETURN related, min(length(path)) AS hops
    ORDER BY hops
}
OPTIONAL MATCH (related)<-[:TEACHES]-(c:Course)
RETURN related.skill_id AS skill_id, related.name AS name,
       related.category AS category, hops,
       collect(DISTINCT {course_id: c.course_id, title: c.title}) AS courses
ORDER BY hops, related.name
"""

GET_SKILL = """
MATCH (s:Skill {skill_id: $skill_id})
OPTIONAL MATCH (c:Course)-[:TEACHES]->(s)
OPTIONAL MATCH (r:Role)-[:REQUIRES_SKILL]->(s)
RETURN s.skill_id AS skill_id, s.name AS name, s.category AS category,
       s.description AS description,
       collect(DISTINCT {course_id: c.course_id, title: c.title}) AS taught_by,
       collect(DISTINCT {role_id: r.role_id, title: r.title}) AS required_by
"""

# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------

LIST_COURSES = """
MATCH (c:Course)
OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
RETURN c.course_id AS course_id, c.title AS title, c.provider AS provider,
       c.level AS level, c.duration_hours AS duration_hours, c.url AS url,
       collect(DISTINCT s.name) AS teaches
ORDER BY c.title
"""

GET_COURSE = """
MATCH (c:Course {course_id: $course_id})
OPTIONAL MATCH (c)-[:TEACHES]->(taught:Skill)
OPTIONAL MATCH (c)-[:REQUIRES]->(required:Skill)
RETURN c.course_id AS course_id, c.title AS title, c.provider AS provider,
       c.level AS level, c.duration_hours AS duration_hours, c.url AS url,
       collect(DISTINCT taught.name) AS teaches,
       collect(DISTINCT {skill_id: required.skill_id, name: required.name}) AS requires_skills
"""

# Variable-length traversal up the prerequisite chain -- the kind of
# query a relational database would need a recursive CTE for, and even
# then couldn't return "all valid orderings" cheaply. Here it's a single
# pattern match with an unbounded hop range.
COURSE_PREREQUISITE_CHAIN = """
MATCH (target:Course {course_id: $course_id})
OPTIONAL MATCH path = (start:Course)-[:PREREQUISITE_OF*1..6]->(target)
WHERE NOT (start)<-[:PREREQUISITE_OF]-()
// NB: on CognoDB, a WHERE pattern-predicate only evaluates correctly
// when the already-bound variable is the *first* node in the pattern
// (as it is here). Written the other way round -- an anonymous node
// first, the bound variable second -- it silently returns wrong
// results instead of erroring. Verified directly against a live
// instance; every pattern-predicate in this file uses the safe form.
WITH target, path
WHERE path IS NOT NULL
UNWIND nodes(path) AS step
RETURN DISTINCT step.course_id AS course_id, step.title AS title,
       step.level AS level, length(path) AS chain_length
ORDER BY chain_length
"""

# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------

LIST_ROLES = """
MATCH (r:Role)
OPTIONAL MATCH (r)-[req:REQUIRES_SKILL]->(s:Skill)
RETURN r.role_id AS role_id, r.title AS title, r.industry AS industry,
       r.seniority AS seniority, r.description AS description,
       count(DISTINCT s) AS skill_count
ORDER BY r.title
"""

GET_ROLE = """
MATCH (r:Role {role_id: $role_id})
OPTIONAL MATCH (r)-[req:REQUIRES_SKILL]->(s:Skill)
RETURN r.role_id AS role_id, r.title AS title, r.industry AS industry,
       r.seniority AS seniority, r.description AS description,
       collect(DISTINCT {
           skill_id: s.skill_id, name: s.name, category: s.category,
           importance: req.importance, min_level: req.min_level
       }) AS required_skills
"""

# Ranks every role by how much of its required skill set the visitor
# already has. A simple aggregation, but one that only makes sense
# because REQUIRES_SKILL is a first-class typed edge rather than a
# denormalised column.
RECOMMEND_ROLES = """
MATCH (r:Role)-[req:REQUIRES_SKILL]->(s:Skill)
WITH r, count(s) AS total,
     sum(CASE WHEN s.skill_id IN $known_skill_ids THEN 1 ELSE 0 END) AS matched
WHERE total > 0
RETURN r.role_id AS role_id, r.title AS title, r.industry AS industry,
       r.seniority AS seniority, matched, total,
       round(100.0 * matched / total) AS match_percent
ORDER BY match_percent DESC, total DESC
"""

# ---------------------------------------------------------------------------
# Flagship query: learning path to a role
# ---------------------------------------------------------------------------

# Step 1: which of the role's required skills are missing, and for each
# missing skill, which courses teach it and what *other* skills does
# that course itself require first (its own prerequisites, which may or
# may not already be known). This single query touches four relationship
# types across a variable number of hops depending on the data -- exactly
# the shape of query that turns into a wall of JOINs and recursive CTEs
# in a relational schema.
LEARNING_PATH_CANDIDATES = """
MATCH (r:Role {role_id: $role_id})-[:REQUIRES_SKILL]->(gap:Skill)
WHERE NOT gap.skill_id IN $known_skill_ids
MATCH (c:Course)-[:TEACHES]->(gap)
OPTIONAL MATCH (c)-[:REQUIRES]->(unmet:Skill)
WHERE NOT unmet.skill_id IN $known_skill_ids
OPTIONAL MATCH (prereq:Course)-[:PREREQUISITE_OF]->(c)
RETURN gap.skill_id AS gap_skill_id, gap.name AS gap_skill_name,
       c.course_id AS course_id, c.title AS title, c.provider AS provider,
       c.level AS level, c.duration_hours AS duration_hours, c.url AS url,
       [x IN collect(DISTINCT {skill_id: unmet.skill_id, name: unmet.name}) WHERE x.skill_id IS NOT NULL] AS unmet_prerequisite_skills,
       [x IN collect(DISTINCT {course_id: prereq.course_id, title: prereq.title}) WHERE x.course_id IS NOT NULL] AS prerequisite_courses
"""

# For a gap skill with no course that teaches it directly reachable from
# what the learner already knows, find the shortest conceptual bridge
# through the skill-adjacency graph -- a pure shortest-path query with
# no fixed hop count, which relational modelling of the same edge list
# cannot express without either a fixed-depth chain of joins or a
# recursive CTE plus manual cycle handling.
SHORTEST_SKILL_BRIDGE = """
MATCH (known:Skill), (gap:Skill {skill_id: $gap_skill_id})
WHERE known.skill_id IN $known_skill_ids
MATCH path = shortestPath((known)-[:RELATED_TO*..5]-(gap))
RETURN [n IN nodes(path) | {skill_id: n.skill_id, name: n.name}] AS bridge,
       length(path) AS hops
ORDER BY hops ASC
LIMIT 1
"""

# Batch metadata lookup used once the learning-path algorithm (in
# routers/paths.py) has decided on a final set of course ids, including
# any prerequisite courses pulled in from the chain traversal above.
COURSES_BY_IDS = """
UNWIND $course_ids AS cid
MATCH (c:Course {course_id: cid})
RETURN c.course_id AS course_id, c.title AS title, c.provider AS provider,
       c.level AS level, c.duration_hours AS duration_hours, c.url AS url
"""

# Pairwise PREREQUISITE_OF edges restricted to a specific set of courses,
# used to topologically order the final learning-path course list.
COURSE_PREREQ_EDGES_AMONG = """
UNWIND $course_ids AS cid
MATCH (a:Course {course_id: cid})-[:PREREQUISITE_OF]->(b:Course)
WHERE b.course_id IN $course_ids
RETURN DISTINCT a.course_id AS from_course, b.course_id AS to_course
"""

# What each of a set of courses teaches, used to decide whether a course
# pulled in from a prerequisite chain is actually still needed once the
# learner's already-known skills are accounted for.
COURSES_TEACHES_BY_IDS = """
UNWIND $course_ids AS cid
MATCH (c:Course {course_id: cid})
OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
RETURN c.course_id AS course_id, collect(DISTINCT s.skill_id) AS teaches_skill_ids
"""
