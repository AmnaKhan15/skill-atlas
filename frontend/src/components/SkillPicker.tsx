import { useMemo, useState } from "react";
import type { Skill } from "../types";
import { categoryStyle } from "../lib/categoryColors";

export default function SkillPicker({
  skills,
  selected,
  onToggle,
}: {
  skills: Skill[];
  selected: string[];
  onToggle: (skillId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? skills.filter((s) => s.name.toLowerCase().includes(q)) : skills;
    const byCategory = new Map<string, Skill[]>();
    for (const skill of filtered) {
      const key = skill.category ?? "Other";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(skill);
    }
    return [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [skills, query]);

  return (
    <div>
      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="thin-scroll max-h-[26rem] space-y-5 overflow-y-auto pr-1">
        {grouped.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No skills match “{query}”.</p>}
        {grouped.map(([category, items]) => {
          const style = categoryStyle(category);
          return (
            <div key={category}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{category}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => {
                  const active = selectedSet.has(skill.skill_id);
                  return (
                    <button
                      key={skill.skill_id}
                      onClick={() => onToggle(skill.skill_id)}
                      title={skill.description ?? undefined}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : `${style.border} ${style.bg} ${style.text} hover:brightness-95`
                      }`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
