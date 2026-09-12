import { Link } from "react-router-dom";
import type { Course } from "../types";

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function CourseCard({ course }: { course: Course }) {
  const levelStyle = (course.level && LEVEL_STYLE[course.level]) || "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <Link
      to={`/courses/${course.course_id}`}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-blue-700">{course.title}</h3>
          {course.level && <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${levelStyle}`}>{course.level}</span>}
        </div>
        <p className="text-xs text-slate-500">
          {course.provider} · {course.duration_hours}h
        </p>
      </div>
      {course.teaches.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {course.teaches.map((skill) => (
            <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
              {skill}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
