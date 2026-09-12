import { Link } from "react-router-dom";
import { useApiQuery } from "../api/hooks";
import type { Course, RoleSummary, Skill } from "../types";
import SkillPicker from "../components/SkillPicker";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useKnownSkillsContext } from "../state/KnownSkillsContext";

const STEPS = [
  "Pick the skills you already have below.",
  "Browse roles ranked by how much of the required skill set you already match.",
  "Open a role to get an ordered course plan for exactly what's missing.",
];

export default function HomePage() {
  const { data: skills, loading, error, refetch } = useApiQuery<Skill[]>("/skills");
  const { data: courses } = useApiQuery<Course[]>("/courses");
  const { data: roles } = useApiQuery<RoleSummary[]>("/roles");
  const { knownSkillIds, toggle, clear } = useKnownSkillsContext();

  const stats: { label: string; value: number | undefined }[] = [
    { label: "skills", value: skills?.length },
    { label: "courses", value: courses?.length },
    { label: "roles", value: roles?.length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Dark, full-bleed hero band -- deliberately breaks from the light
          card style used everywhere else in the app, so the landing page
          reads as a "front door" rather than just another content page. */}
      <section className="relative mb-12 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 py-12 shadow-xl sm:px-10 sm:py-16">
        <svg
          aria-hidden
          viewBox="0 0 400 300"
          className="pointer-events-none absolute -left-14 -top-16 h-[30rem] w-[30rem] text-blue-400 opacity-[0.14]"
        >
          <g stroke="currentColor" strokeWidth="1.2">
            <line x1="40" y1="220" x2="140" y2="120" />
            <line x1="140" y1="120" x2="260" y2="160" />
            <line x1="140" y1="120" x2="190" y2="30" />
            <line x1="260" y1="160" x2="360" y2="90" />
            <line x1="260" y1="160" x2="300" y2="260" />
          </g>
          <g fill="currentColor">
            <circle cx="40" cy="220" r="5" className="animate-float-slow" style={{ animationDelay: "0s" }} />
            <circle cx="140" cy="120" r="6" className="animate-float-slow" style={{ animationDelay: "0.8s" }} />
            <circle cx="190" cy="30" r="4" className="animate-float-slow" style={{ animationDelay: "1.6s" }} />
            <circle cx="260" cy="160" r="6" className="animate-float-slow" style={{ animationDelay: "0.4s" }} />
            <circle cx="360" cy="90" r="5" className="animate-float-slow" style={{ animationDelay: "1.2s" }} />
            <circle cx="300" cy="260" r="4" className="animate-float-slow" style={{ animationDelay: "2s" }} />
          </g>
        </svg>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <span className="h-1.5 w-1.5 animate-pulse-node rounded-full bg-blue-400" />
              Graph-powered career planning
            </span>
            <h1
              className="animate-fade-up font-display text-4xl font-semibold leading-tight text-white sm:text-5xl"
              style={{ animationDelay: "90ms" }}
            >
              Find the shortest path to your next role.
            </h1>
            <p className="mt-4 max-w-xl animate-fade-up text-base text-slate-300" style={{ animationDelay: "180ms" }}>
              Skill Atlas models skills, courses and job roles as a connected graph — not a spreadsheet. Tell it
              what you already know, and it traverses the graph to find which roles you're closest to and exactly
              which courses close the gap, in the right order.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "280ms" }}>
              <Link
                to="/roles"
                className="group rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-400"
              >
                Explore roles{" "}
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/skills"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10"
              >
                Explore the skill graph
              </Link>
            </div>

            <div className="mt-8 flex animate-fade-up flex-wrap gap-x-8 gap-y-3" style={{ animationDelay: "360ms" }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-semibold text-white">{s.value ?? "–"}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-2xl backdrop-blur"
            style={{ animationDelay: "220ms" }}
          >
            <p className="font-display text-base font-semibold text-white">How it works</p>
            <ol className="relative mt-4 space-y-6">
              {STEPS.map((text, i) => (
                <li key={text} className="relative flex gap-3">
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[9px] top-6 h-6 w-px bg-white/15 animate-grow-line"
                      style={{ animationDelay: `${520 + i * 260}ms` }}
                    />
                  )}
                  <span
                    className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 animate-pop-in items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white"
                    style={{ animationDelay: `${360 + i * 260}ms` }}
                  >
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">What do you already know?</h2>
            <p className="mt-1 text-sm text-slate-500">Your selections are saved on this device and used across the whole app.</p>
          </div>
          {knownSkillIds.length > 0 && (
            <button onClick={clear} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-red-200 hover:text-red-600">
              Clear all
            </button>
          )}
        </div>

        {loading && <LoadingState label="Loading skills…" />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {skills && <SkillPicker skills={skills} selected={knownSkillIds} onToggle={toggle} />}
      </section>
    </div>
  );
}
