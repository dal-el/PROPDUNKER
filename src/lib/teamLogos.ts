// Deterministic Euroleague logo resolver.
// Uses canonical mappings to avoid slow probing and name mismatches.

import teamAliases from "@/metadata/team_aliases.json";
import teamCanonical from "@/metadata/team_canonical.json";
import teamCodes from "@/metadata/team_codes.json";

type Dict<T = any> = Record<string, T>;

const _aliases = teamAliases as Dict<string>;
const _canonical = teamCanonical as Dict<{ display?: string }>;
const _codes = teamCodes as Dict<string>;

function normAliasKey(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2019\u2018']/g, "'")
    .replace(/[^a-z0-9 '\-]/g, "")
    .trim();
}

export function isWindowsPath(s: string): boolean {
  return /^[A-Za-z]:\\/.test(String(s ?? ""));
}

export function isLikelyUrl(s: string): boolean {
  const v = String(s ?? "");
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("//") || v.startsWith("/");
}

export function resolveEuroleagueLogoSlug(raw?: string | null): string | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;

  // If we got an official short code (EFS, OLY...), map it.
  const upper = s.toUpperCase();
  if (_codes[upper]) return _codes[upper];

  // Try alias table (lowercase, normalized).
  const k = normAliasKey(s);
  if (k && _aliases[k]) return _aliases[k];

  // If it's already a canonical key, accept it.
  const canonKey = s.toLowerCase().replace(/\s+/g, "_");
  if (_canonical[canonKey]) return canonKey;

  return undefined;
}

export function resolveEuroleagueLogoUrl(raw?: string | null): string | undefined {
  const slug = resolveEuroleagueLogoSlug(raw);
  if (!slug) return undefined;
  return `/logos/euroleague/${slug}.png`;
}

export function resolveEuroleagueDisplayName(raw?: string | null): string | undefined {
  const slug = resolveEuroleagueLogoSlug(raw);
  if (!slug) return undefined;
  return _canonical[slug]?.display ?? slug;
}
