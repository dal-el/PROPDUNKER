import { create } from "zustand";

export type SortKey =
  | "L5"
  | "L10"
  | "L15"
  | "L20"
  | "vL5"
  | "vL10"
  | "vL15"
  | "vL20"
  | "EDGE";

export type PropsScope = "MAIN" | "ALT" | "ALL";

export type PlayerOption = {
  key: string; // stable UI key, derived from feed rows
  name: string;
  surname: string;
  team: string;
  teamDisplay?: string;
  logoUrl?: string;
};

type State = {
  // server query filters
  match: string; // 'all' or backend match id
  bookmaker: string;
  scope: PropsScope;

  // sorting
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  sortByOdds: boolean;
  sortByLastN: boolean;

  // odds range
  oddsMin: string;
  oddsMax: string;

  // prop category filter (empty => ALL)
  propCategories: string[];
  propCategoryOptions: string[];

  // player filter (empty + no team => ALL PLAYERS)
  playerKeys: string[];
  playerOptions: PlayerOption[];
  selectedPlayers: string[]; // empty => ALL PLAYERS (subject to selectedTeam)
  selectedTeam: string | null; // raw team key/name
  playerSearch: string;

  set: <K extends keyof State>(key: K, value: State[K]) => void;
};

export const useFilters = create<State>((set) => ({
  match: "upcoming",
  bookmaker: "all",
  scope: "ALL",

  sortKey: "L15",
  sortDir: "desc",
  sortByOdds: false,
  sortByLastN: true,

  oddsMin: "1.40",
  oddsMax: "3.00",

  propCategories: [],
  propCategoryOptions: [],

  playerKeys: [],
  playerOptions: [],
  selectedPlayers: [],
  selectedTeam: null,
  playerSearch: "",

  set: (key, value) => set({ [key]: value } as any),
}));
