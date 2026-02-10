import { TEAM_ALIASES, TEAM_CANONICAL, TEAM_CODES, type TeamKey } from "./teamData";

/**
 * Normalize a raw team string (backend/provider) into a canonical TeamKey.
 *
 * Deterministic mapping:
 * - TEAM_ALIASES keys are stored in lowercase (normalized phrases)
 * - TEAM_CODES keys are stored in uppercase (provider codes like VIR)
 * - TEAM_CANONICAL keys are canonical slugs (snake_case)
 */
export function resolveTeamKey(raw: string | null | undefined): TeamKey | null {
  if (!raw) return null;

  const s = String(raw).trim();
  if (!s) return null;

  // 1) Direct canonical key
  if ((TEAM_CANONICAL as any)[s]) return s as TeamKey;

  // 2) Direct alias (lowercase)
  const lower = s.toLowerCase();
  const directAlias = (TEAM_ALIASES as any)[lower];
  if (directAlias) return directAlias as TeamKey;

  // 3) Provider code (uppercase)
  const up = s.toUpperCase();
  const code = (TEAM_CODES as any)[up];
  if (code) return code as TeamKey;

  // 4) Normalized alias: strip punctuation, collapse whitespace, lowercase
  const norm = lower
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normAlias = (TEAM_ALIASES as any)[norm];
  if (normAlias) return normAlias as TeamKey;

  // 5) Normalized canonical attempt (snake_case)
  const snake = norm.replace(/\s+/g, "_");
  if ((TEAM_CANONICAL as any)[snake]) return snake as TeamKey;

  return null;
}
