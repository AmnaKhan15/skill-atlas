export interface Skill {
  skill_id: string;
  name: string;
  category: string | null;
  description: string | null;
}

export interface SkillNeighbor {
  skill_id: string;
  name: string;
  category: string | null;
  hops: number;
  courses: { course_id: string; title: string }[];
}

export interface Course {
  course_id: string;
  title: string;
  provider: string | null;
  level: string | null;
  duration_hours: number | null;
  url: string | null;
  teaches: string[];
}

export interface CoursePrerequisite {
  course_id: string;
  title: string;
  level: string | null;
  chain_length: number;
}

export interface RoleSummary {
  role_id: string;
  title: string;
  industry: string | null;
  seniority: string | null;
  description: string | null;
  skill_count: number;
}

export interface RoleRequiredSkill {
  skill_id: string;
  name: string;
  category: string | null;
  importance: "core" | "nice-to-have";
  min_level: string;
}

export interface RoleDetail extends RoleSummary {
  required_skills: RoleRequiredSkill[];
}

export interface RoleRecommendation {
  role_id: string;
  title: string;
  industry: string | null;
  seniority: string | null;
  matched: number;
  total: number;
  match_percent: number;
}

export interface LearningPathCourse {
  course_id: string;
  title: string;
  provider: string | null;
  level: string | null;
  duration_hours: number | null;
  url: string | null;
  covers_missing_skills: string[];
  is_prerequisite_only: boolean;
}

export interface UncoveredSkill {
  skill_id: string;
  name: string;
  closest_known_bridge: { bridge: { skill_id: string; name: string }[]; hops: number } | null;
}

export interface LearningPathResult {
  role: { role_id: string; title: string };
  already_qualified: boolean;
  known_skill_count?: number;
  missing_skill_count?: number;
  courses: LearningPathCourse[];
  uncovered_skills: UncoveredSkill[];
}
