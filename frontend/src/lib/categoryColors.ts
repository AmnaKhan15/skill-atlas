/** Consistent, accessible color coding per skill category, used across
 * chips, badges and the skill graph so a category reads the same way
 * everywhere in the app. */
const PALETTE: Record<string, { bg: string; text: string; border: string; dot: string; fill: string }> = {
  "Programming Languages": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500", fill: "fill-teal-500" },
  "Web & Frameworks": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500", fill: "fill-cyan-500" },
  "Data & ML": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500", fill: "fill-violet-500" },
  "Cloud & DevOps": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", fill: "fill-orange-500" },
  "Design & UX": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-500", fill: "fill-pink-500" },
  Product: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", fill: "fill-green-500" },
  Security: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", fill: "fill-red-500" },
  "Soft Skills": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", fill: "fill-amber-500" },
  "CS Fundamentals": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", fill: "fill-indigo-500" },
};

const FALLBACK = { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400", fill: "fill-slate-400" };

export function categoryStyle(category: string | null | undefined) {
  if (!category) return FALLBACK;
  return PALETTE[category] ?? FALLBACK;
}

export const ALL_CATEGORIES = Object.keys(PALETTE);
