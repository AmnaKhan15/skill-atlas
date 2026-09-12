import { useMemo, useState } from "react";
import { useApiQuery } from "../api/hooks";
import type { Course } from "../types";
import CourseCard from "../components/CourseCard";
import { EmptyState, ErrorState, SkeletonCard } from "../components/StateViews";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function CoursesPage() {
  const { data: courses, loading, error, refetch } = useApiQuery<Course[]>("/courses");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!courses) return [];
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (level && c.level !== level) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.teaches.some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [courses, query, level]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Courses</h1>
        <p className="mt-1 text-sm text-slate-500">The full catalog behind every learning path in Skill Atlas.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or skill…"
          className="w-64 max-w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => setLevel(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${level === null ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}
          >
            All levels
          </button>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${level === l ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No courses match" description="Try a different search term or clear the level filter." />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.course_id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
