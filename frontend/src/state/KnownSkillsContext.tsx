import { createContext, useContext, type ReactNode } from "react";
import { useKnownSkills } from "./useKnownSkills";

type KnownSkillsValue = ReturnType<typeof useKnownSkills>;

const KnownSkillsContext = createContext<KnownSkillsValue | null>(null);

export function KnownSkillsProvider({ children }: { children: ReactNode }) {
  const value = useKnownSkills();
  return <KnownSkillsContext.Provider value={value}>{children}</KnownSkillsContext.Provider>;
}

export function useKnownSkillsContext(): KnownSkillsValue {
  const ctx = useContext(KnownSkillsContext);
  if (!ctx) throw new Error("useKnownSkillsContext must be used within KnownSkillsProvider");
  return ctx;
}
