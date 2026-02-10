import type { TeamKey } from "./teamData";

export type JerseyTheme = {
  base: string;
  letters: string;
  stripes: string | null; // ONLY FC Barcelona uses this (per rule)
};

export const JERSEY_THEMES: Record<TeamKey, JerseyTheme> = {
  "anadolu_efes": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "as_monaco": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "baskonia": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "crvena_zvezda": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "dubai": {
    "base": "#000000",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "olimpia_milano": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "fc_barcelona": {
    "base": "#1C2B5A",
    "letters": "#EDBB00",
    "stripes": null
  },
  "fc_bayern": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "fenerbahce": {
    "base": "#F5C400",
    "letters": "#0A1A3A",
    "stripes": null
  },
  "hapoel_tel_aviv": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "asvel": {
    "base": "#000000",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "maccabi_tel_aviv": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "olympiacos": {
    "base": "#D0061F",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "panathinaikos": {
    "base": "#006633",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "paris": {
    "base": "#000000",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "partizan": {
    "base": "#000000",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "real_madrid": {
    "base": "#FFFFFF",
    "letters": "#0A1A3A",
    "stripes": null
  },
  "valencia": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "virtus_bologna": {
    "base": "#000000",
    "letters": "#FFFFFF",
    "stripes": null
  },
  "zalgiris": {
    "base": "#111827",
    "letters": "#FFFFFF",
    "stripes": null
  }
} as any;

export function getJerseyTheme(teamKey: TeamKey | null | undefined): JerseyTheme {
  if (!teamKey) return { base: "#111827", letters: "#FFFFFF", stripes: null };
  return (JERSEY_THEMES as any)[teamKey] ?? { base: "#111827", letters: "#FFFFFF", stripes: null };
}
