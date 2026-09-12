import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useApiMutation, useApiQuery } from "../api/hooks";
import type { LearningPathResult, RoleDetail } from "../types";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { categoryStyle } from "../lib/categoryColors";
import { useKnownSkillsContext } from "../state/KnownSkillsContext";

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { data: role, loading, error, refetch } = useApiQuery<RoleDetail>(roleId ? `/roles/${roleId}` : null, [roleId]);
  const { knownSkillIds } = useKnownSkillsContext();
  const {
    data: path,
    loading: pathLoading,
    error: pathError,
    mutate: computePath,
  } = useApiMutation<{ known_skill_ids: string[]; target_role_id: string }, LearningPathResult>("/learning-path");

  useEffect(() => {
    if (roleId && knownSkillIds.length > 0) {
      computePath({ known_skill_ids: knownSkillIds, target_role_id: roleId }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, knownSkillIds.join(",")]);

  if (loading) return <LoadingState label="Loading role…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!role) return null;

  const knownSet = new Set(knownSkillIds);
  const core = role.required_skills.filter((s) => s.importance === "core");
  const niceToHave = role.required_skills.filter((s) => s.importance !== "core");

  return (
    <div className="animate-fade-in">
      <Link to="/roles" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
        ← All roles
      </Link>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{role.industry}</p>
            <h1 className="font-display mt-1 text-3xl font-semibold text-slate-900">{role.title}</h1>
          </div>
          {role.seniority && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{role.seniority}</span>}
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">{role.description}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <SkillGroup label="Core skills" skills={core} knownSet={knownSet} />
          <SkillGroup label="Nice to have" skills={niceToHave} knownSet={knownSet} />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-semibold text-slate-900">Your learning path</h2>

        {knownSkillIds.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="Select your known skills first"
              description="Head to the Home page and pick what you already know — this page will compute an ordered course plan to close the gap for this role."
              action={
                <Link to="/" className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                  Select skills
                </Link>
              }
            />
          </div>
        )}

        {knownSkillIds.length > 0 && pathLoading && <LoadingState label="Computing the shortest path through the course graph…" />}
        {pathError && <ErrorState message={pathError} onRetry={() => computePath({ known_skill_ids: knownSkillIds, target_role_id: roleId! })} />}

        {path && !pathLoading && (
          <div className="mt-5">
            {path.already_qualified ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">
                You already have every skill required for this role. 🎉
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-500">
                  Missing <strong className="text-slate-700">{path.missing_skill_count}</strong> of the role's required skills.
                  Here's the shortest ordered path of courses to close that gap, respecting each course's own
                  prerequisites.
                </p>
                {path.courses.length === 0 ? (
                  <EmptyState title="No course path found" description="Nothing in the catalog currently teaches the missing skills directly." />
                ) : (
                  <ol className="space-y-3">
                    {path.courses.map((course, i) => (
                      <li key={course.course_id} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link to={`/courses/${course.course_id}`} className="font-semibold text-slate-900 hover:text-blue-700">
                              {course.title}
                            </Link>
                            {course.level && (
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${LEVEL_STYLE[course.level] ?? ""}`}>
                                {course.level}
                              </span>
                            )}
                            {course.is_prerequisite_only && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                Prerequisite
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {course.provider} · {course.duration_hours}h
                          </p>
                          {course.covers_missing_skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {course.covers_missing_skills.map((s) => (
                                <span key={s} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                                  covers {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {path.uncovered_skills.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">No direct course found for:</p>
                    <ul className="mt-2 space-y-1">
                      {path.uncovered_skills.map((s) => (
                        <li key={s.skill_id}>
                          <strong>{s.name}</strong>
                          {s.closest_known_bridge && (
                            <span className="text-amber-700">
                              {" "}
                              — closest related skill you know:{" "}
                              {s.closest_known_bridge.bridge[0]?.name} ({s.closest_known_bridge.hops} hop
                              {s.closest_known_bridge.hops === 1 ? "" : "s"} away)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillGroup({
  label,
  skills,
  knownSet,
}: {
  label: string;
  skills: RoleDetail["required_skills"];
  knownSet: Set<string>;
}) {
  if (skills.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const style = categoryStyle(skill.category);
          const known = knownSet.has(skill.skill_id);
          return (
            <span
              key={skill.skill_id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${style.bg} ${style.text} ${style.border} ${
                known ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              {known && <span className="text-emerald-600">✓</span>}
              {skill.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
