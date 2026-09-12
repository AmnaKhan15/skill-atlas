import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApiQuery } from "../api/hooks";
import type { Skill, SkillNeighbor } from "../types";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { categoryStyle } from "../lib/categoryColors";
import SkillGraph from "../components/SkillGraph";

export default function SkillsPage() {
  const { data: skills, loading, error, refetch } = useApiQuery<Skill[]>("/skills");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!selectedId && skills && skills.length > 0) setSelectedId(skills[0].skill_id);
  }, [skills, selectedId]);

  const {
    data: neighbors,
    loading: neighborsLoading,
    error: neighborsError,
  } = useApiQuery<SkillNeighbor[]>(selectedId ? `/skills/${selectedId}/neighborhood?depth=${depth}` : null, [selectedId, depth]);

  const selectedSkill = useMemo(() => skills?.find((s) => s.skill_id === selectedId) ?? null, [skills, selectedId]);

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    const q = query.trim().toLowerCase();
    return q ? skills.filter((s) => s.name.toLowerCase().includes(q)) : skills;
  }, [skills, query]);

  if (loading) return <LoadingState label="Loading skill graph…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Skill Graph</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Pick a skill to see what's conceptually adjacent to it, up to three hops out — the same{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">RELATED_TO</code> traversal that powers the
          "closest bridge" suggestion on a role's learning path.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <div className="thin-scroll max-h-[32rem] space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
            {filteredSkills.map((skill) => {
              const style = categoryStyle(skill.category);
              const active = skill.skill_id === selectedId;
              return (
                <button
                  key={skill.skill_id}
                  onClick={() => setSelectedId(skill.skill_id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : style.dot}`} />
                  {skill.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {selectedSkill && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">{selectedSkill.name}</h2>
                <p className="text-sm text-slate-500">{selectedSkill.description}</p>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      depth === d ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-500"
                    }`}
                  >
                    {d} hop{d > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {neighborsLoading && <LoadingState label="Traversing the graph…" />}
          {neighborsError && <ErrorState message={neighborsError} />}
          {!neighborsLoading && neighbors && neighbors.length === 0 && (
            <EmptyState title="No related skills found" description="This skill isn't connected to others in the seed data yet." />
          )}
          {!neighborsLoading && selectedSkill && neighbors && neighbors.length > 0 && (
            <>
              <SkillGraph centerName={selectedSkill.name} neighbors={neighbors} onSelect={setSelectedId} />
              <div className="mt-4 flex flex-wrap gap-2">
                {neighbors.map((n) => (
                  <button
                    key={n.skill_id}
                    onClick={() => setSelectedId(n.skill_id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    {n.name} · {n.hops} hop{n.hops > 1 ? "s" : ""}
                    {n.courses.length > 0 && n.courses[0].course_id && (
                      <>
                        {" "}
                        ·{" "}
                        <Link to={`/courses/${n.courses[0].course_id}`} className="underline" onClick={(e) => e.stopPropagation()}>
                          {n.courses[0].title}
                        </Link>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
