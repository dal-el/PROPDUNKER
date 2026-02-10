export type Tier = "MAIN" | "ALT";

export type BetLine = {
  id: string;
  player: { name: string; team: string; pos?: string };
  prop: { label: string; tier: Tier };
  side: "OVER" | "UNDER";
  line: number;
  odds: number;
  hit: { L5: number; L10: number; L15: number; L20: number };
  value: { vL5: number; vL10: number; vL15: number; vL20: number };
  trMean?: number;     // future
  oppDef?: number;     // future
  bookmaker: string;
  match: "upcoming" | "all";
  games: Array<{
    date: string;
    opp: string;
    ha: "H" | "A";
    stat: number;
    minutes: number;
  }>;
};
