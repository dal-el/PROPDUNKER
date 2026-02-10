import { TEAM_ALIASES, TEAM_CANONICAL, TEAM_CODES, type TeamKey } from "./teamData";

/** Normalize a raw team string (backend/provider) into a canonical TeamKey. */
export function resolveTeamKey(raw: string | null | undefined): TeamKey | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Exact alias
  const direct = (TEAM_ALIASES as any)[s];
  if (direct) return direct as TeamKey;

  const up = s.toUpperCase();

  // Alias by normalized key
  const aliasUp = (TEAM_ALIASES as any)[up];
  if (aliasUp) return aliasUp as TeamKey;

  // Provider codes
  const code = (TEAM_CODES as any)[up];
  if (code) return code as TeamKey;

  // Canonical key itself
  if ((TEAM_CANONICAL as any)[up]) return up as TeamKey;

  // Try: remove punctuation and extra spaces
  const compact = up.replace(/[^A-Z0-9]+/g, " ").trim();
  const aliasCompact = (TEAM_ALIASES as any)[compact];
  if (aliasCompact) return aliasCompact as TeamKey;

  return null;
}
