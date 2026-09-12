import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "skill-atlas:known-skills";

function readInitial(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** The learner's self-reported skill set. Persisted to localStorage so
 * a non-technical visitor doesn't lose their picks on refresh -- there
 * are no user accounts in this app, this is the entire "session". */
export function useKnownSkills() {
  const [knownSkillIds, setKnownSkillIds] = useState<string[]>(readInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knownSkillIds));
  }, [knownSkillIds]);

  const toggle = useCallback((skillId: string) => {
    setKnownSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId]
    );
  }, []);

  const clear = useCallback(() => setKnownSkillIds([]), []);

  return { knownSkillIds, toggle, clear };
}
