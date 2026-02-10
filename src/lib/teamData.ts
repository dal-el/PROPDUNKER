/* AUTO-GENERATED: Team canonicalization sources */
export const TEAM_CANONICAL = {
  "anadolu_efes": {
    "display": "Anadolu Efes"
  },
  "as_monaco": {
    "display": "AS Monaco"
  },
  "baskonia": {
    "display": "Baskonia"
  },
  "crvena_zvezda": {
    "display": "Crvena Zvezda"
  },
  "dubai": {
    "display": "Dubai Basketball"
  },
  "olimpia_milano": {
    "display": "Olimpia Milano"
  },
  "fc_barcelona": {
    "display": "FC Barcelona"
  },
  "fc_bayern": {
    "display": "FC Bayern Munich"
  },
  "fenerbahce": {
    "display": "Fenerbahce"
  },
  "hapoel_tel_aviv": {
    "display": "Hapoel Tel Aviv"
  },
  "asvel": {
    "display": "LDLC ASVEL Villeurbanne"
  },
  "maccabi_tel_aviv": {
    "display": "Maccabi Tel Aviv"
  },
  "olympiacos": {
    "display": "Olympiacos"
  },
  "panathinaikos": {
    "display": "Panathinaikos"
  },
  "paris": {
    "display": "Paris Basketball"
  },
  "partizan": {
    "display": "Partizan"
  },
  "real_madrid": {
    "display": "Real Madrid"
  },
  "valencia": {
    "display": "Valencia Basket"
  },
  "virtus_bologna": {
    "display": "Virtus Bologna"
  },
  "zalgiris": {
    "display": "Zalgiris Kaunas"
  }
} as const;
export const TEAM_CODES = {
  "EFS": "anadolu_efes",
  "FBB": "fenerbahce",
  "RMB": "real_madrid",
  "PBB": "paris",
  "OLY": "olympiacos",
  "PAO": "panathinaikos",
  "MTA": "maccabi_tel_aviv",
  "ZAL": "zalgiris",
  "KBA": "baskonia",
  "ASV": "asvel",
  "ASM": "as_monaco",
  "BAR": "fc_barcelona",
  "BAY": "fc_bayern",
  "CZV": "crvena_zvezda",
  "PAR": "partizan",
  "DUB": "dubai",
  "EA7": "olimpia_milano",
  "VBC": "valencia",
  "VIR": "virtus_bologna",
  "HTA": "hapoel_tel_aviv"
} as const;
export const TEAM_ALIASES = {
  "anadolu efes istanbul": "anadolu_efes",
  "armani milan": "olimpia_milano",
  "as monaco": "as_monaco",
  "asvel villeurbanne": "asvel",
  "ax armani exchange milan": "olimpia_milano",
  "baskonia vitoria gasteiz": "baskonia",
  "bayern munich": "fc_bayern",
  "crvena zvezda belgrade": "crvena_zvezda",
  "crvena zvezda meridianbet belgrade": "crvena_zvezda",
  "dubai": "dubai",
  "dubai b c": "dubai",
  "dubai b.c.": "dubai",
  "dubai basket": "dubai",
  "dubai basketball": "dubai",
  "dubai basketball club": "dubai",
  "dubai bball": "dubai",
  "dubai bc": "dubai",
  "dubai club": "dubai",
  "ea7 emporio armani milan": "olimpia_milano",
  "emporio armani milan": "olimpia_milano",
  "fc bayern munich": "fc_bayern",
  "fenerbahce beko istanbul": "fenerbahce",
  "fenerbahce istanbul": "fenerbahce",
  "hapoel ibi tel aviv": "hapoel_tel_aviv",
  "kosner baskonia vitoria gasteiz": "baskonia",
  "ldlc asvel villeurbanne": "asvel",
  "maccabi rapyd tel aviv": "maccabi_tel_aviv",
  "maccabi tel aviv": "maccabi_tel_aviv",
  "olimpia milano": "olimpia_milano",
  "olympiacos piraeus": "olympiacos",
  "panathinaikos aktor athens": "panathinaikos",
  "panathinaikos athens": "panathinaikos",
  "paris basketball": "paris",
  "partizan mozzart bet belgrade": "partizan",
  "saski baskonia": "baskonia",
  "valencia basket": "valencia",
  "virtus bologna": "virtus_bologna",
  "virtus segafredo bologna": "virtus_bologna",
  "virtus segafredo": "virtus_bologna",
  "segafredo virtus bologna": "virtus_bologna",
  "zalgiris kaunas": "zalgiris"
} as const;

export type TeamKey = keyof typeof TEAM_CANONICAL;
