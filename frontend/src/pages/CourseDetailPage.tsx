import { Link, useParams } from "react-router-dom";
import { useApiQuery } from "../api/hooks";
import type { Course, CoursePrerequisite } from "../types";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

interface CourseWithSkills extends Course {
  requires_skills: { skill_id: string; name: string }[];
}

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, loading, error, refetch } = useApiQuery<CourseWithSkills>(courseId ? `/courses/${courseId}` : null, [courseId]);
  const { data: chain, loading: chainLoading } = useApiQuery<CoursePrerequisite[]>(
    courseId ? `/courses/${courseId}/prerequisites` : null,
    [courseId]
  );

  if (loading) return <LoadingState label="Loading course…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!course) return null;

  return (
    <div className="animate-fade-in">
      <Link to="/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
        ← All courses
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{course.provider}</p>
            <h1 className="font-display mt-1 text-3xl font-semibold text-slate-900">{course.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{course.duration_hours} hours</p>
          </div>
          {course.level && (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${LEVEL_STYLE[course.level] ?? ""}`}>{course.level}</span>
          )}
        </div>

        {course.url && (
          <a href={course.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            View course ↗
          </a>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Teaches</h3>
            <div className="flex flex-wrap gap-2">
              {course.teaches.map((s) => (
                <span key={s} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {course.requires_skills.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Assumes you already know</h3>
              <div className="flex flex-wrap gap-2">
                {course.requires_skills.map((s) => (
                  <span key={s.skill_id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-semibold text-slate-900">Prerequisite chain</h2>
        <p className="mt-1 text-sm text-slate-500">
          Every course you'd need to complete first, found by walking the course graph outward — however many hops
          deep that chain happens to go.
        </p>

        {chainLoading && <LoadingState label="Walking the prerequisite graph…" />}
        {!chainLoading && (!chain || chain.length === 0) && (
          <div className="mt-4">
            <EmptyState title="No prerequisites" description="This course has no foundational courses ahead of it — a good starting point." />
          </div>
        )}
        {!chainLoading && chain && chain.length > 0 && (
          <ol className="mt-5 flex flex-wrap items-center gap-2">
            {chain.map((step, i) => (
              <li key={step.course_id} className="flex items-center gap-2">
                <Link
                  to={`/courses/${step.course_id}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                >
                  {step.title}
                </Link>
                {i < chain.length - 1 && (
                  <span className="text-slate-300">→</span>
                )}
              </li>
            ))}
            <span className="text-slate-300">→</span>
            <li className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">{course.title}</li>
          </ol>
        )}
      </div>
    </div>
  );
}
