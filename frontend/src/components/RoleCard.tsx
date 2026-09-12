import { Link } from "react-router-dom";
import type { RoleRecommendation, RoleSummary } from "../types";

export default function RoleCard({
  role,
  match,
}: {
  role: RoleSummary;
  match?: RoleRecommendation;
}) {
  return (
    <Link
      to={`/roles/${role.role_id}`}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-slate-900 group-hover:text-blue-700">{role.title}</h3>
          {role.seniority && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {role.seniority}
            </span>
          )}
        </div>
        {role.industry && <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-500">{role.industry}</p>}
        <p className="line-clamp-2 text-sm text-slate-500">{role.description}</p>
      </div>

      <div className="mt-4">
        {match ? (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Skill match</span>
              <span className={match.match_percent >= 60 ? "text-emerald-600" : "text-slate-500"}>
                {match.match_percent}% · {match.matched}/{match.total}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${match.match_percent >= 60 ? "bg-emerald-500" : "bg-blue-400"}`}
                style={{ width: `${match.match_percent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">{role.skill_count} required skills</p>
        )}
      </div>
    </Link>
  );
}
