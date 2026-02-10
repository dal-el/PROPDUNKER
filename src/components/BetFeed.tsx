"use client";


import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BetRow } from "@/components/BetRow";
import BetDrawerOverlay from "@/components/BetDrawerOverlay";
import { useFilters } from "@/lib/store";
import { resolveEuroleagueDisplayName, resolveEuroleagueLogoSlug } from "@/lib/teamLogos";
import { resolveTeamKey } from "@/lib/resolveTeamKey";
import { BetLine } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Keep bookmaker casing consistent across backend + UI filters.
function _normBook(s: unknown) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function _canonBook(s: unknown) {
  const n = _normBook(s);
  if (!n) return String(s ?? "");
  const map: Record<string, string> = {
    STOIXIMAN: "Stoiximan",
    NOVIBET: "Novibet",
    BWIN: "Bwin",
    PAMESTOIXIMA: "Pamestoixima",
    OPAP: "Pamestoixima",
  };
  return map[n] || String(s ?? "");
}

function parseNum(s: string, fallback: number) {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function computeHitPct(row: BetLine, n: number): number {
  const used = (row.games as any[])?.slice(-n) ?? [];
  if (!used.length) return 0;
  const hits = used.reduce((acc, g) => {
    const stat = Number(g?.stat ?? 0);
    const ok = row.side === "OVER" ? stat > row.line : stat < row.line;
    return acc + (ok ? 1 : 0);
  }, 0);
  return (hits / used.length) * 100;
}

function computeEdgePct(row: BetLine, n: number): number {
  const used = (row.games as any[])?.slice(-n) ?? [];
  if (!used.length) return 0;
  const hits = used.reduce((acc, g) => {
    const stat = Number(g?.stat ?? 0);
    const ok = row.side === "OVER" ? stat > row.line : stat < row.line;
    return acc + (ok ? 1 : 0);
  }, 0);
  const p = hits / used.length;

  const oddsRaw = (row as any)?.odds ?? 0;
  const odds = Number.isFinite(oddsRaw) ? oddsRaw : Number(oddsRaw);
  const implied = odds > 0 ? 1 / odds : 0;

  return (p - implied) * 100; // percentage points
}


function getMetric(row: BetLine, sortKey: string) {
  const key = String(sortKey || "");

  // EDGE: when sortKey is vL5/vL10/vL15/vL20, ignore hit-rate and sort by edge for last N games.
  if (key.startsWith("v")) {
    const upper = key.toUpperCase(); // e.g. "VL15"
    const raw = (row.value as any)?.[upper];
    const num = Number(raw);
    if (Number.isFinite(num)) return num;

    // Fallback: compute from games only if backend value missing
    const base = key.slice(1).toUpperCase(); // "L15"
    const nFromKey = Number(base.replace("L", ""));
    const n = Number.isFinite(nFromKey) && nFromKey > 0 ? nFromKey : 15;
    return computeEdgePct(row, n);
  }

  // HIT RATE: prefer backend-computed hit-rate (computed from history final).
  const upper = key.toUpperCase();
  const backendRaw = (row.hit as any)?.[upper];
  const backendNum = Number(backendRaw);
  if (Number.isFinite(backendNum)) return backendNum;

  // Fallback: compute from games only if backend hit missing
  const nFromKey = Number(upper.replace("L", ""));
  if (Number.isFinite(nFromKey) && nFromKey > 0) {
    return computeHitPct(row, nFromKey);
  }

  const raw = (row.hit as any)?.[upper];
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}


// Normalize prop.sheet_key to match backend history final keys (deterministic; no heuristics).
function normalizeSheetKey(prop: any): string {
  const raw = String(prop?.sheet_key ?? "").trim();
  const btn = String(prop?.ui_name ?? prop?.label ?? "").trim().toUpperCase();

  // Backend history keys observed:
  // OR, DR, SH_M, SH_AT
  if (btn === "OREB" || raw.toUpperCase() === "OREB" || raw === "Offensive Rebounds") return "OR";
  if (btn === "DREB" || raw.toUpperCase() === "DREB" || raw === "Defensive Rebounds") return "DR";
  if (btn === "FGM" || btn === "FG MADE" || raw.toUpperCase() === "FGM" || raw === "FGM") return "SH_M";
  if (btn === "FGA" || raw.toUpperCase() === "FGA" || raw === "SH_AT") return "SH_AT";

  return raw;
}

function normalizeRow(r: any): BetLine {
  const prop = (r && typeof r === "object" ? r.prop : null) ?? {};
  const betType = String(prop.bet_type ?? "").toUpperCase();
  const tier = prop.tier ?? (betType.includes("ALT") ? "ALT" : "MAIN");

  const hit = r?.hit ?? {};
  const value = r?.value ?? {};

  
  // Canonical team key (used for BY TEAM filtering)
  const logoSrcRaw =
    (r as any)?.team?.logo ||
    (r as any)?.teamLogo ||
    (r as any)?.logo ||
    ((r as any)?.player)?.teamLogo ||
    ((r as any)?.player)?.logo;

  const logoStr = typeof logoSrcRaw === "string" ? logoSrcRaw : "";
  const logoSlug = (() => {
    // support: /logos/euroleague/<slug>.(png|svg|webp) or full URL
    const m = logoStr.match(/\/logos\/euroleague\/([^\/]+)\.(png|svg|webp|jpg|jpeg)/i);
    if (m && m[1]) return m[1];
    const b = logoStr.split("/").pop() || "";
    const mm = b.match(/^([a-z0-9_\-]+)\.(png|svg|webp|jpg|jpeg)$/i);
    if (mm && mm[1]) return mm[1];
    return "";
  })();

  const teamKey =
    resolveTeamKey(logoSlug) ||
    resolveTeamKey((r as any)?.player?.team) ||
    resolveTeamKey((r as any)?.team?.name) ||
    resolveTeamKey((r as any)?.team?.display) ||
    resolveTeamKey((r as any)?.teamName) ||
    resolveTeamKey((r as any)?.team_code) ||
    resolveTeamKey((r as any)?.teamCode) ||
    resolveTeamKey((r as any)?.team?.code) ||
    resolveTeamKey((r as any)?.team?.abbr) ||
    resolveTeamKey((r as any)?.teamAbbr) ||
    null;
return {
    ...(r || {}),
    __teamKey: teamKey,
    bookmaker: _canonBook(r?.bookmaker),
    prop: {
      label: prop.label ?? prop.ui_name ?? "Prop",
      tier,
      sheet_key: normalizeSheetKey(prop),
      bet_type: prop.bet_type ?? betType,
    },
    hit: {
      L5: Number(hit.L5 ?? 0),
      L10: Number(hit.L10 ?? 0),
      L15: Number(hit.L15 ?? 0),
      L20: Number(hit.L20 ?? 0),
    },
    value: {
      vL5: Number(value.vL5 ?? 0),
      vL10: Number(value.vL10 ?? 0),
      vL15: Number(value.vL15 ?? 0),
      vL20: Number(value.vL20 ?? 0),
    },
    games: Array.isArray(r?.games) ? r.games : [],
  } as BetLine;
}

export function BetFeed() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filters = useFilters();

  const [isLgUp, setIsLgUp] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);


  const [all, setAll] = React.useState<BetLine[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Drawer state
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [drawerPos, setDrawerPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const [drawerLastN, setDrawerLastN] = React.useState<number | null>(null);
  const rowRefs = React.useRef(new Map<string, HTMLDivElement | null>());

  // Fetch data from backend
  React.useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams({
          bookmaker: filters.bookmaker,
          // 🔥 HERE IS THE FIX:
          // pass selected match directly
          match: filters.match,
          scope: filters.scope,
          limit: "2000",
        });

        const res = await fetch(`${API_BASE}/api/feed?${qs.toString()}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const appliedMatch = res.headers.get("x-applied-match") ?? "";
        const json = await res.json();

        if (!alive) return;

        const arr = Array.isArray(json) ? json : [];
        const normalized = arr.filter(Boolean).map(normalizeRow);
        setAll(normalized);

        // Feed-derived filter options (source of truth: rows in /api/feed)
        // Keep deterministic order: first appearance in the feed.
        const catSeen = new Set<string>();
        const cats: string[] = [];
        const playerSeen = new Set<string>();
        const players: any[] = [];

        for (const row of normalized as any[]) {
          const cat = String(row?.prop?.label ?? "").trim();
          if (cat && !catSeen.has(cat)) {
            catSeen.add(cat);
            cats.push(cat);
          }

          const rawName = String(row?.player?.name ?? "").trim();
          const teamRaw = String(row?.player?.team ?? "").trim();
          const teamKey = (row as any)?.__teamKey ?? resolveTeamKey(teamRaw);
          const team = String(teamKey ?? teamRaw).trim();
          if (rawName) {
            // Keep key stable by using the raw backend name string, but always prefix with canonical team key when available.
            const key = `${team}::${rawName}`;
            if (!playerSeen.has(key)) {
              playerSeen.add(key);

              // Normalize common name formats:
              //  - "LAST,FIRST"              -> surname=LAST,   name=FIRST
              //  - "FIRST LAST,FIRST"        -> surname=LAST,   name=FIRST
              //  - "FIRST MIDDLE LAST"       -> surname=LAST,   name=FIRST MIDDLE
              const parsePlayerName = (v: string) => {
                const s = String(v ?? "").trim();
                if (!s) return { first: "", last: "" };

                if (s.includes(",")) {
                  const [a, bRaw] = s.split(",", 2);
                  const aClean = (a ?? "").trim();
                  const bClean = (bRaw ?? "").trim();
                  const bFirst = bClean.split(/\s+/).filter(Boolean)[0] ?? "";

                  const aParts = aClean.split(/\s+/).filter(Boolean);

                  // If left side starts with the same token as right side, treat left as "FIRST LAST"
                  // e.g. "CARSEN EDWARDS,CARSEN" -> last="EDWARDS", first="CARSEN"
                  if (aParts.length >= 2 && bFirst && aParts[0].toLowerCase() === bFirst.toLowerCase()) {
                    return { first: bFirst, last: aParts.slice(1).join(" ") };
                  }

                  // Otherwise treat as "LAST,FIRST"
                  return { first: bFirst || bClean, last: aClean };
                }

                const parts = s.split(/\s+/).filter(Boolean);
                if (parts.length === 1) return { first: parts[0], last: "" };
                return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
              };

              const { first, last } = parsePlayerName(rawName);
              const surname = (last || rawName).trim();
              const name = (first || "").trim();

              players.push({ key, name, surname, team, teamKey });
            }
          }
        }

        filters.set("propCategoryOptions", cats);
        filters.set("playerOptions", players);
        filters.set("playerKeys", players.map((p) => p.key));

      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load");
        setAll([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [filters.bookmaker, filters.match, filters.scope]);

  // Client-side odds filtering + sorting
  const data = React.useMemo(() => {
    const oddsMin = parseNum(filters.oddsMin, 1.0);
    const oddsMax = parseNum(filters.oddsMax, 100.0);

    let rows = all.slice();

    // Prop category filter (empty => ALL)
    const cats = (filters as any).propCategories as string[] | undefined;
    if (Array.isArray(cats) && cats.length > 0) {
      const set = new Set(cats);
      rows = rows.filter((r: any) => set.has(String(r?.prop?.label ?? "").trim()));
    }

    // Player / Team filter
    const team = (filters as any).selectedTeam as string | null | undefined;
    const selPlayers = (filters as any).selectedPlayers as string[] | undefined;

    if (team) {
      // team is stored as canonical TeamKey (snake_case)
      rows = rows.filter((r: any) => {
        const tk = String((r as any)?.__teamKey ?? "").trim();
        if (tk) return tk === team;

        // Fallback: try to derive from the raw feed string (no heuristics beyond canonical resolver)
        const raw = String(r?.player?.team ?? r?.team?.name ?? "").trim();
        const derived = resolveTeamKey(raw);
        return derived ? String(derived) === team : false;
      });
    }
if (Array.isArray(selPlayers) && selPlayers.length > 0) {
      const set = new Set(selPlayers);
      rows = rows.filter((r: any) => {
        const name = String(r?.player?.name ?? "").trim();

        // selectedPlayers keys are canonical: `${teamKey}::${rawName}`
        const tk = String((r as any)?.__teamKey ?? "").trim();
        const rawTeam = String(r?.player?.team ?? r?.team?.name ?? "").trim();
        const teamKey = tk || (resolveTeamKey(rawTeam) ? String(resolveTeamKey(rawTeam)) : "");

        const key = `${teamKey}::${name}`;
        return set.has(key);
      });
    }

    // Odds filter
    rows = rows.filter((r) => r.odds >= oddsMin && r.odds <= oddsMax);

    rows.sort((a, b) => {
      const va = getMetric(a, filters.sortKey);
      const vb = getMetric(b, filters.sortKey);
      const dir = filters.sortDir === "asc" ? 1 : -1;
      if (va === vb) return 0;
      return (va - vb) * dir;
    });

    return rows;
  }, [all, filters.oddsMin, filters.oddsMax, filters.sortKey, filters.sortDir, (filters as any).propCategories, (filters as any).selectedPlayers, (filters as any).selectedTeam]);

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const ROW_GAP = isLgUp ? 0 : 55;
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 132 + ROW_GAP,
    overscan: 10,
  });

  // Close drawer when filters change
  React.useEffect(() => {
    setOpenId(null);
    setDrawerPos(null);
                    setDrawerLastN(null);
  }, [filters.match, filters.bookmaker, filters.scope, filters.oddsMin, filters.oddsMax, filters.sortKey, filters.sortDir, (filters as any).propCategories, (filters as any).selectedPlayers, (filters as any).selectedTeam]);

  if (error) {
    return <div className="px-4 py-6 text-[13px] text-red-400">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[12px] opacity-70">
          Showing{" "}
          <span suppressHydrationWarning className="font-semibold text-white">
            {mounted ? data.length : ""}
          </span>{" "}
          bet lines
        </div>
        <div className="text-[12px] opacity-70">{loading ? "Loading…" : ""}</div>
      </div>

      <div ref={parentRef} className="h-[calc(100vh-132px)] overflow-auto scrollbar-thin">
        {!loading && data.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] opacity-75">{"NO PROPS"}</div>
        )}

        <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
          {virtualizer.getVirtualItems().map((v) => {
            const row = data[v.index];
            if (!row) return null;
            const isOpen = openId === row.id;
            return (
              <div
                key={row.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${v.start}px)`,
                                    zIndex: isOpen ? 2 : 1,
                }}
              >
                <BetRow
                  ref={(node) => {
                    rowRefs.current.set(row.id, node);
                  }}
                  row={row}
                  open={isOpen}
                  onToggle={(n) => {
                    const scroller = parentRef.current;
                    const card = rowRefs.current.get(row.id);

                    if (!scroller || !card) {
                      setOpenId((prev) => (prev === row.id ? null : row.id));
                      setDrawerPos(null);
                      return;
                    }

                    if (openId === row.id) {
                      setOpenId(null);
                      setDrawerPos(null);
                      return;
                    }

                    const scrollerRect = scroller.getBoundingClientRect();
                    const cardRect = card.getBoundingClientRect();
                    const top = cardRect.bottom - scrollerRect.top + scroller.scrollTop + 8;
                    const left = 0;
                    const width = scroller.clientWidth;
                    setOpenId(row.id);
                    {
                      const picked = Number(n);
                      if (Number.isFinite(picked) && picked > 0) {
                        setDrawerLastN(picked);
                      } else if (drawerLastN == null) {
                        const kk = String(filters.sortKey || "L15");
                        const base = kk.startsWith("v") ? kk.slice(1) : kk;
                        const nn = Number(base.toUpperCase().replace("L", ""));
                        setDrawerLastN(Number.isFinite(nn) && nn > 0 ? nn : 15);
                      }
                    }
                    setDrawerPos({ top, left, width });
                  }}
                  onPickHit={(k) => {
                    filters.set("sortKey", k as any);
                    const kk = String(k || "L15");
                    const base = kk.startsWith("v") ? kk.slice(1) : kk;
                    const n = Number(base.toUpperCase().replace("L", ""));
                    setDrawerLastN(Number.isFinite(n) && n > 0 ? n : 15);
                  }}
                />
              </div>
            );
          })}

          {openId && drawerPos && (() => {
            const row = data.find((r) => r.id === openId);
            if (!row) return null;
            return (
              <BetDrawerOverlay
                key={`${openId}-${drawerLastN ?? ""}`}
                row={row}
                top={drawerPos.top}
                left={drawerPos.left}
                width={drawerPos.width}
                initialLastN={drawerLastN ?? undefined}
                onClose={() => {
                  setOpenId(null);
                  setDrawerPos(null);
                }}
                allLines={all}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default BetFeed;
