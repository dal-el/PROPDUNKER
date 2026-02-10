"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import { BetLine } from "@/lib/types";
import { fmtLine, fmtOdds, fmtPctInt, fmtSignedPct, valueTone } from "@/lib/format";
import { useFilters } from "@/lib/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

/** ✅ FIX: accept either probability [0..1] or percentage [0..100] */
function normalizePct(x: any): number {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1.0000001 ? n * 100 : n;
  return Math.max(0, Math.min(100, pct));
}

// -------- Shared history cache (per player_id) for BetRow fallback --------
// Used ONLY when backend feed hit-rates are missing/zero for stats that are not populated in row.games (e.g. OR/DR/SH_M).
type HistoryGame = any;
const __historyCache = new Map<string, Promise<HistoryGame[]>>();

function getPlayerIdFromRow(row: any): string | null {
  const cand = [
    row?.player_id,
    row?.playerId,
    row?.player?.id,
    row?.player?.player_id,
    row?.player?.playerId,
    row?.prop?.player_id,
    row?.prop?.playerId,
  ];
  for (const c of cand) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  return null;
}

async function fetchHistoryGames(playerId: string, lastN: number): Promise<HistoryGame[]> {
  const url = `${API_BASE}/api/player/${encodeURIComponent(playerId)}/history?last_n=${encodeURIComponent(
    String(lastN)
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  const games = json && Array.isArray(json.recent_games) ? json.recent_games : [];
  return games;
}

function getHistoryGamesCached(playerId: string, lastN: number): Promise<HistoryGame[]> {
  const key = `${playerId}::${lastN}`;
  const existing = __historyCache.get(key);
  if (existing) return existing;
  const p = fetchHistoryGames(playerId, lastN).catch(() => []);
  __historyCache.set(key, p);
  return p;
}

function readFinalStat(finalObj: any, key: string): number | null {
  if (!finalObj || typeof finalObj !== "object") return null;
  const raw = finalObj[key];
  if (raw === "#TRUE#") return 1;
  if (raw === "#FALSE#") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function computeHitPctFromHistory(row: any, games: any[], n: number): number {
  const used = games.slice(0, n); // recent_games is already recent; keep first N
  if (!used.length) return 0;

  const sheetKey = String(row?.prop?.sheet_key ?? "").trim();
  const hits = used.reduce((acc: number, g: any) => {
    const v = readFinalStat(g?.final, sheetKey) ?? 0;

    // ✅ FIX: match backend/chart rule
    const ok = row?.side === "OVER" ? v >= row?.line : v < row?.line;

    return acc + (ok ? 1 : 0);
  }, 0);

  return (hits / used.length) * 100;
}

function safeLogoUrl(u: string | undefined | null) {
  if (!u) return "";
  if (u.startsWith("/")) return API_BASE + u;
  return u;
}

export type HitKey = "L5" | "L10" | "L15" | "L20";

/* ================= STAT RESOLUTION (STRICT) ================= */

/**
 * Resolve per-game stat value for the current row.
 * - Prefer backend-provided per-game `final` stats when present.
 * - Use ONLY explicit key mapping (no labels/heuristics).
 * - Fallback to `g.stat` when no final field is available.
 */
function resolveGameStat(row: BetLine | undefined, g: any): number {
  const sheetKeyRaw = (row as any)?.prop?.sheet_key;
  const sheetKey = typeof sheetKeyRaw === "string" ? sheetKeyRaw.trim() : "";
  const k0 = sheetKey.toUpperCase();

  // Explicit aliases for known backend keys.
  // NOTE: backend history `final` uses OR/DR for off/def rebounds and SH_M for FG made.
  const ALIASES: Record<string, string[]> = {
    // rebounds
    "OFFENSIVE REBOUNDS": ["OR", "OREB", "OFFENSIVE REBOUNDS"],
    "OREB": ["OR", "OREB", "OFFENSIVE REBOUNDS"],
    "DEFENSIVE REBOUNDS": ["DR", "DREB", "DEFENSIVE REBOUNDS"],
    "DREB": ["DR", "DREB", "DEFENSIVE REBOUNDS"],

    // FG made
    "FGM": ["SH_M", "FGM", "FG_M"],
    "FG MADE": ["SH_M", "FGM", "FG_M", "FG MADE"],

    // DD / TD (can arrive as spreadsheet booleans)
    "DD": ["DD"],
    "TD": ["TD"],
  };

  const containers: any[] = [
    g?.final,
    g?.FINAL,
    g?.stats?.final,
    g?.stats,
    g?.boxscore,
    g?.game?.final,
    g?.game?.stats?.final,
    g?.game,
    g, // last: top-level
  ].filter(Boolean);

  const keys = ALIASES[k0] ?? (sheetKey ? [sheetKey] : []);

  for (const key of keys) {
    for (const c of containers) {
      if (!Object.prototype.hasOwnProperty.call(c, key)) continue;
      const v = c[key];
      if (v === "#TRUE#" || v === true) return 1;
      if (v === "#FALSE#" || v === false) return 0;
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) return n;
    }
  }

  const s = g?.stat;
  const sn = typeof s === "number" ? s : Number(s);
  return Number.isFinite(sn) ? sn : 0;
}

/* ================= HIT BADGES ================= */

function HitBadges({
  row,
  onPick,
  open,
  onToggle,
}: {
  row?: BetLine;
  onPick?: (k: HitKey) => void;
  open?: boolean;
  onToggle?: (n?: number) => void;
}) {
  const sortKey = useFilters((s) => s.sortKey);
  const keys: HitKey[] = ["L5", "L10", "L15", "L20"];
  const [historyPcts, setHistoryPcts] = React.useState<Record<string, number> | null>(null);

  // Fallback: for stats that are NOT populated in feed games (e.g. OR/DR/SH_M), compute hit-rates from history
  // ONLY when backend-provided hit-rates are all zero.
  React.useEffect(() => {
    const r: any = row as any;
    if (!r) return;

    const sk = String(r?.prop?.sheet_key ?? "").trim().toUpperCase();
    const needs = sk === "OR" || sk === "DR" || sk === "SH_M";
    if (!needs) return;

    const h = r?.hit || {};
    // normalize here too (if backend ever returns 0..1)
    const allZero =
      [h.L5, h.L10, h.L15, h.L20].every((x: any) => normalizePct(x) === 0);

    if (!allZero) return;

    const pid = getPlayerIdFromRow(r);
    if (!pid) return;

    let alive = true;
    (async () => {
      const games = await getHistoryGamesCached(pid, 20);
      if (!alive) return;
      const pcts: Record<string, number> = {
        L5: computeHitPctFromHistory(r, games, 5),
        L10: computeHitPctFromHistory(r, games, 10),
        L15: computeHitPctFromHistory(r, games, 15),
        L20: computeHitPctFromHistory(r, games, 20),
      };
      setHistoryPcts(pcts);
    })();

    return () => {
      alive = false;
    };
  }, [row]);

  return (
    <div className="grid grid-cols-4 gap-2 w-max min-w-[272px]">
      {keys.map((k) => {
        const active = sortKey === k || sortKey === (("v" + k) as any);
        const n = Number(String(k).replace("L", "")) || 0;
        const upper = String(k).toUpperCase();

        const backendPctRaw = (row as any)?.hit?.[upper];

        // ✅ FIX: normalize backend value (0..1 or 0..100)
        let pct = normalizePct(backendPctRaw);

        // ✅ FIX: if backend missing (NaN), compute from games
        if (!Number.isFinite(Number(backendPctRaw))) {
          const used = (row as any)?.games?.slice(-n) ?? [];
          const hits = used.reduce((acc: number, g: any) => {
            const v = resolveGameStat(row as any, g);
            const ok = row?.side === "OVER" ? v >= (row as any).line : v < (row as any).line; // ✅ >=
            return acc + (ok ? 1 : 0);
          }, 0);
          pct = used.length ? (hits / used.length) * 100 : 0;
        }

        // ✅ FIX: if backend was effectively zero AND we computed history fallback, use it
        if (historyPcts && normalizePct(backendPctRaw) === 0) {
          const hp = Number(historyPcts[upper]);
          if (Number.isFinite(hp)) pct = Math.max(0, Math.min(100, hp));
        }

        const toneClass =
          pct <= 35 ? "text-rose-300" : pct <= 65 ? "text-amber-300" : "text-emerald-300";

        return (
          <button
            key={k}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (active) {
                onToggle?.(n);
                return;
              }
              onPick?.(k);
              onToggle?.(n);
            }}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border",
              "w-[62px] h-[28px] text-[13px] leading-none",
              "border-stroke bg-soft",
              toneClass,
              "hover:bg-white/8 transition",
              active &&
                "border-amber-400/60 bg-amber-400/10 ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
            )}
            aria-label={`Show last ${k.replace("L", "")} chart`}
          >
            {fmtPctInt(pct)}
          </button>
        );
      })}
    </div>
  );
}

function EdgeText({ row }: { row: BetLine }) {
  const sortKey = useFilters((s) => s.sortKey);
  const baseKeyForN = sortKey?.startsWith("v") ? sortKey.slice(1) : sortKey;
  const nFromKey = Number(String(baseKeyForN || "L15").replace("L", ""));
  const n = Number.isFinite(nFromKey) ? nFromKey : 15;

  const used = (row as any)?.games?.slice(-n) ?? [];
  const hits = used.reduce((acc: number, g: any) => {
    const v = resolveGameStat(row as any, g);
    const ok = row.side === "OVER" ? v >= row.line : v < row.line; // ✅ >=
    return acc + (ok ? 1 : 0);
  }, 0);

  const p = used.length ? hits / used.length : 0;

  const oddsRaw = (row as any)?.odds ?? 0;
  const odds = Number.isFinite(oddsRaw) ? oddsRaw : Number(oddsRaw);
  const implied = odds > 0 ? 1 / odds : 0;

  const edgePct = (p - implied) * 100; // percent points
  const tone = valueTone(edgePct);

  return (
    <span
      className={clsx(
        "text-[11px] font-semibold tracking-wide",
        tone === "pos" && "text-emerald-200",
        tone === "neg" && "text-rose-200",
        tone === "neu" && "text-white/70"
      )}
    >
      EDGE {fmtSignedPct(edgePct)}
    </span>
  );
}

function ExpValueText({ row }: { row: BetLine }) {
  const sortKey = useFilters((s) => s.sortKey);
  const baseKeyForN = sortKey?.startsWith("v") ? sortKey.slice(1) : sortKey;
  const nFromKey = Number(String(baseKeyForN || "L15").replace("L", ""));
  const n = Number.isFinite(nFromKey) ? nFromKey : 15;

  const used = (row as any)?.games?.slice(-n) ?? [];
  const hits = used.reduce((acc: number, g: any) => {
    const v = resolveGameStat(row as any, g);
    const ok = row.side === "OVER" ? v >= row.line : v < row.line; // ✅ >=
    return acc + (ok ? 1 : 0);
  }, 0);

  const p = used.length ? hits / used.length : 0;

  const oddsRaw = (row as any)?.odds ?? 0;
  const odds = Number.isFinite(oddsRaw) ? oddsRaw : Number(oddsRaw);
  const ev = p * odds - 1; // expected ROI (fraction)
  const evPct = ev * 100; // percent points

  const tone = valueTone(evPct);

  return (
    <span
      className={clsx(
        "text-[11px] font-semibold tracking-wide",
        tone === "pos" && "text-emerald-200",
        tone === "neg" && "text-rose-200",
        tone === "neu" && "text-white/70"
      )}
    >
      EXP VALUE {fmtSignedPct(evPct)}
    </span>
  );
}

function MobileEdgeEvBadges({ row }: { row: BetLine }) {
  const sortKey = useFilters((s) => s.sortKey);
  const baseKeyForN = sortKey?.startsWith("v") ? sortKey.slice(1) : sortKey;
  const nFromKey = Number(String(baseKeyForN || "L15").replace("L", ""));
  const n = Number.isFinite(nFromKey) ? nFromKey : 15;

  const used = (row as any)?.games?.slice(-n) ?? [];
  const hits = used.reduce((acc: number, g: any) => {
    const v = resolveGameStat(row as any, g);
    const ok = row.side === "OVER" ? v >= row.line : v < row.line; // ✅ >=
    return acc + (ok ? 1 : 0);
  }, 0);

  const p = used.length ? hits / used.length : 0;

  const oddsRaw = (row as any)?.odds ?? 0;
  const odds = Number.isFinite(oddsRaw) ? oddsRaw : Number(oddsRaw);
  const implied = odds > 0 ? 1 / odds : 0;

  const edgePct = (p - implied) * 100;
  const evPct = (p * odds - 1) * 100;

  const edgeText = fmtSignedPct(edgePct);
  const evText = fmtSignedPct(evPct);

  return (
    <div className="flex flex-col items-end gap-1 pointer-events-none select-none">
      <div className="relative w-[54px]">
        <img src="/edge_badge.png" alt="Edge badge" className="w-full h-auto block" draggable={false} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-extrabold text-[10px] drop-shadow">{edgeText}</span>
        </div>
      </div>

      <div className="relative w-[54px]">
        <img
          src="/expected_value_badge.png"
          alt="Expected value badge"
          className="w-full h-auto block"
          draggable={false}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-extrabold text-[10px] drop-shadow">{evText}</span>
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function SidePill({ row }: { row: BetLine }) {
  const isOver = row.side === "OVER";
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px]", "border-stroke bg-white/5")}>
      <span className={clsx("font-semibold", isOver ? "text-emerald-200" : "text-rose-200")}>{row.side}</span>
      <span className="opacity-90">{fmtLine(row.line)}</span>
    </span>
  );
}

function OddsPill({ odds }: { odds: number }) {
  return (
    <span className={clsx("inline-flex items-center justify-center rounded-full border px-3 py-1 text-[12px] leading-none", "border-stroke bg-white/5")}>
      {fmtOdds(odds)}
    </span>
  );
}

function TierBadge({ tier }: { tier: BetLine["prop"]["tier"] }) {
  return (
    <span
      className={clsx(
        "badge",
        tier === "ALT"
          ? "border-sky-400/35 bg-sky-400/10 text-sky-200"
          : "border-violet-400/35 bg-violet-400/10 text-violet-200"
      )}
    >
      {tier}
    </span>
  );
}

/* ================= MAIN ROW ================= */

export const BetRow = React.forwardRef<
  HTMLDivElement,
  {
    row?: BetLine;
    open: boolean;
    onToggle: (n?: number) => void;
    onPickHit?: (k: HitKey) => void;
  }
>(function BetRow({ row, open, onToggle, onPickHit }, ref) {
  if (!row) return null;

  const logoSrcRaw =
    (row as any)?.team?.logo ||
    (row as any)?.teamLogo ||
    (row as any)?.logo ||
    ((row as any)?.player)?.teamLogo ||
    ((row as any)?.player)?.logo;

  const logoSrc = safeLogoUrl(logoSrcRaw);

  const propCategoryFull =
    ((row as any)?.prop)?.label ||
    ((row as any)?.prop)?.fullName ||
    ((row as any)?.prop)?.name ||
    (row as any)?.propLabel ||
    "";

  const bookmakerFull =
    (row as any)?.bookmakerFullName ||
    (row as any)?.bookmakerName ||
    (row as any)?.bookmaker ||
    (row as any)?.book ||
    (row as any)?.sportsbook ||
    "";

  return (
    <div
      ref={ref}
      className={clsx(
        "rounded-2xl border border-stroke bg-card shadow-glow overflow-visible lg:overflow-hidden",
        open && "ring-1 ring-white/20"
      )}
    >
      <button
        onClick={onToggle}
        className={clsx("relative w-max min-w-full lg:w-full px-4 py-3 text-left", "hover:bg-white/3 transition")}
      >
        {/* HEADER CONTAINER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 mb-3 sm:mb-0">
          <div className="min-w-0 flex-1">
            {/* LINE 1  🔼 REAL MOVE */}
            <div className="flex items-center gap-2 min-w-0 -translate-y-[4px]">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/5 border border-stroke/60 overflow-hidden flex items-center justify-center">
                {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full object-cover" /> : <div className="h-6 w-6 rounded-full bg-white/10" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[14px] font-semibold truncate">{row.player.name}</span>
                  <span className="inline-flex items-center justify-center rounded-full border border-stroke bg-white/5 px-2 py-[2px] text-[11px] leading-none">
                    {row.player.pos}
                  </span>
                </div>
              </div>

              {/* Mobile: replace chevron with EDGE + VALUE (stacked) */}
              <div className="lg:hidden ml-auto flex flex-col items-end justify-center gap-1 opacity-90">
                <EdgeText row={row} />
                <ExpValueText row={row} />
              </div>
            </div>

            {/* LINE 2 (mobile) */}
            <div className="mt-0 lg:hidden flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                <SidePill row={row} />
                {propCategoryFull ? <span className="text-[12px] font-medium opacity-90 truncate">{propCategoryFull}</span> : null}
                <OddsPill odds={(row as any)?.odds ?? 0} />
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:flex mt-2 flex items-center gap-2 flex-wrap">
              <SidePill row={row} />
              {propCategoryFull ? <span className="text-[12px] font-medium opacity-90">{propCategoryFull}</span> : null}
              <OddsPill odds={(row as any)?.odds ?? 0} />
            </div>
          </div>

          {/* Desktop: % pills (clickable), bookmaker/tier, and chevron aligned in one grid */}
          <div className="hidden lg:grid grid-cols-[62px_62px_62px_62px_20px] gap-2 items-start">
            {/* Row 1: hit pills */}
            <div className="col-span-4 flex justify-end">
              <HitBadges row={row} onPick={onPickHit} open={open} onToggle={onToggle} />
            </div>

            {/* Row 1: chevron (fixed column) */}
            <div className="flex justify-center pt-[2px] opacity-70">
              {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>

            {/* Row 2: bookmaker + tier under the pills (not under chevron) */}
            {bookmakerFull || row.prop?.tier ? (
              <div className="col-span-4 mt-4 flex items-center justify-end gap-2 -translate-x-1 translate-y-1">
                {bookmakerFull ? <div className="text-[11px] leading-none opacity-70 whitespace-nowrap">{bookmakerFull}</div> : null}
                <TierBadge tier={row.prop.tier} />
              </div>
            ) : (
              <div className="col-span-4" />
            )}

            {/* spacer cell under chevron */}
            <div />
          </div>
        </div>
      </button>

      {/* MOBILE BOTTOM ROW */}
      <div className="lg:hidden px-4 pb-3 min-w-full w-max">
        <div className="mt-3 flex items-end justify-between gap-3" onClick={(e) => e.stopPropagation()}>
          {/* % pills */}
          <HitBadges row={row} onPick={onPickHit} open={open} onToggle={onToggle} />

          {/* Right side */}
          {bookmakerFull || row.prop?.tier ? (
            <div className="shrink-0 flex flex-col items-end justify-end">
              {row.prop?.tier ? <TierBadge tier={row.prop.tier} /> : null}
              {bookmakerFull ? <div className="mt-1 text-[11px] leading-none opacity-70 whitespace-nowrap">{bookmakerFull}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});
