import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useKnownSkillsContext } from "../state/KnownSkillsContext";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/roles", label: "Roles" },
  { to: "/courses", label: "Courses" },
  { to: "/skills", label: "Skill Graph" },
];

/** Three connected nodes rather than a needle -- a small nod to "skills,
 * courses and roles as a graph" instead of a single-direction compass. */
function AtlasMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 17.5 12 6.5m6 11-6-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 17.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="6.5" r="2" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="2" fill="currentColor" className="origin-center animate-pulse-node" style={{ animationDelay: "0.6s" }} />
      <circle cx="17.5" cy="17.5" r="2" fill="currentColor" className="origin-center animate-pulse-node" style={{ animationDelay: "1.2s" }} />
    </svg>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { knownSkillIds } = useKnownSkillsContext();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="group flex items-center gap-2 text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform duration-500 ease-out group-hover:rotate-90">
              <AtlasMark />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Skill Atlas</span>
          </NavLink>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/skills"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {knownSkillIds.length} skill{knownSkillIds.length === 1 ? "" : "s"} selected
          </NavLink>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-6 pb-3 sm:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
