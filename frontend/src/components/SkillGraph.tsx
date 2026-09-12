import { useMemo, useState } from "react";
import type { SkillNeighbor } from "../types";
import { categoryStyle } from "../lib/categoryColors";

const SIZE = 620;
const CENTER = SIZE / 2;
// Kept well inside the viewBox edge (not SIZE/2) so a wide label pill on
// an outer-ring node -- which can extend ~80px past the node's own
// center point -- never gets clipped by the SVG boundary.
const RADIUS_BY_HOP: Record<number, number> = { 1: 150, 2: 225, 3: 225 };
const MAX_LABEL = 20;

interface Positioned extends SkillNeighbor {
  x: number;
  y: number;
}

/** Rough glyph-width estimate for Inter at a given font size -- good
 * enough to size a background pill without a canvas measurement pass. */
function estimateTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.58;
}

function truncate(name: string) {
  return name.length > MAX_LABEL ? name.slice(0, MAX_LABEL - 1) + "…" : name;
}

function Label({
  text,
  y,
  fontSize,
  bold,
}: {
  text: string;
  y: number;
  fontSize: number;
  bold?: boolean;
}) {
  const label = truncate(text);
  const paddingX = 7;
  const width = estimateTextWidth(label, fontSize) + paddingX * 2;
  const height = fontSize + 10;
  return (
    <g pointerEvents="none">
      <rect
        x={-width / 2}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
        className="fill-white stroke-slate-200"
        strokeWidth={1}
      />
      <text
        x={0}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={bold ? 700 : 600}
        className="fill-slate-700"
      >
        {label}
      </text>
    </g>
  );
}

export default function SkillGraph({
  centerName,
  neighbors,
  onSelect,
}: {
  centerName: string;
  neighbors: SkillNeighbor[];
  onSelect: (skillId: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const positioned = useMemo<Positioned[]>(() => {
    const byHop = new Map<number, SkillNeighbor[]>();
    for (const n of neighbors) {
      const hop = Math.min(n.hops, 3);
      if (!byHop.has(hop)) byHop.set(hop, []);
      byHop.get(hop)!.push(n);
    }
    const result: Positioned[] = [];
    for (const [hop, items] of byHop) {
      const radius = RADIUS_BY_HOP[hop] ?? 250;
      items.forEach((item, i) => {
        const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
        result.push({
          ...item,
          x: CENTER + radius * Math.cos(angle),
          y: CENTER + radius * Math.sin(angle),
        });
      });
    }
    return result;
  }, [neighbors]);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full overflow-visible"
      role="img"
      aria-label={`Skills related to ${centerName}`}
    >
      {/* Guide rings */}
      <circle cx={CENTER} cy={CENTER} r={RADIUS_BY_HOP[1]} fill="none" stroke="#e2e8f0" strokeDasharray="2 6" />
      <circle cx={CENTER} cy={CENTER} r={RADIUS_BY_HOP[2]} fill="none" stroke="#e2e8f0" strokeDasharray="2 6" />

      {/* Edges */}
      {positioned.map((n) => (
        <line
          key={`edge-${n.skill_id}`}
          x1={CENTER}
          y1={CENTER}
          x2={n.x}
          y2={n.y}
          stroke={hovered === n.skill_id ? "#6366f1" : "#cbd5e1"}
          strokeWidth={hovered === n.skill_id ? 2 : 1}
          strokeDasharray={n.hops > 1 ? "4 4" : undefined}
        />
      ))}

      {/* Center node */}
      <g transform={`translate(${CENTER}, ${CENTER})`}>
        <circle r={10} fill="#4338ca" stroke="white" strokeWidth={2} />
        <Label text={centerName} y={16} fontSize={12} bold />
      </g>

      {/* Neighbor nodes */}
      {positioned.map((n) => {
        const style = categoryStyle(n.category);
        const isHovered = hovered === n.skill_id;
        return (
          <g
            key={n.skill_id}
            transform={`translate(${n.x}, ${n.y})`}
            className="cursor-pointer"
            onClick={() => onSelect(n.skill_id)}
            onMouseEnter={() => setHovered(n.skill_id)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle r={isHovered ? 9 : 7} className={style.fill} fillOpacity={n.hops > 1 ? 0.75 : 1} stroke="white" strokeWidth={1.5} />
            <Label text={n.name} y={12} fontSize={10} />
          </g>
        );
      })}
    </svg>
  );
}
