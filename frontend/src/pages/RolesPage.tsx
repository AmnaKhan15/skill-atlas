import { useEffect, useMemo } from "react";
import { useApiQuery, useApiMutation } from "../api/hooks";
import type { RoleRecommendation, RoleSummary } from "../types";
import RoleCard from "../components/RoleCard";
import { EmptyState, ErrorState, SkeletonCard } from "../components/StateViews";
import { useKnownSkillsContext } from "../state/KnownSkillsContext";
import { Link } from "react-router-dom";

export default function RolesPage() {
  const { data: roles, loading, error, refetch } = useApiQuery<RoleSummary[]>("/roles");
  const { knownSkillIds } = useKnownSkillsContext();
  const { data: recommendations, mutate: recommend } = useApiMutation<{ known_skill_ids: string[] }, RoleRecommendation[]>(
    "/roles/recommend"
  );

  useEffect(() => {
    if (knownSkillIds.length > 0) {
      recommend({ known_skill_ids: knownSkillIds }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownSkillIds.join(",")]);

  const matchByRole = useMemo(() => {
    const map = new Map<string, RoleRecommendation>();
    recommendations?.forEach((r) => map.set(r.role_id, r));
    return map;
  }, [recommendations]);

  const sortedRoles = useMemo(() => {
    if (!roles) return [];
    if (matchByRole.size === 0) return roles;
    return [...roles].sort((a, b) => (matchByRole.get(b.role_id)?.match_percent ?? 0) - (matchByRole.get(a.role_id)?.match_percent ?? 0));
  }, [roles, matchByRole]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Roles</h1>
          <p className="mt-1 text-sm text-slate-500">
            {knownSkillIds.length > 0
              ? "Ranked by how much of each role's required skill graph you already match."
              : "Pick your skills on the Home page to see personalized match scores."}
          </p>
        </div>
        {knownSkillIds.length === 0 && (
          <Link to="/" className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            Select your skills →
          </Link>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && sortedRoles.length === 0 && (
        <EmptyState title="No roles yet" description="Run the seed script to load roles into CognoDB." />
      )}

      {!loading && sortedRoles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRoles.map((role) => (
            <RoleCard key={role.role_id} role={role} match={matchByRole.get(role.role_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
