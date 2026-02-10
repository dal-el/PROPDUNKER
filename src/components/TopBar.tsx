"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { useFilters, SortKey, PropsScope } from "@/lib/store";
import { clsx } from "clsx";
import teamCanonical from "@/metadata/team_canonical.json";
import { resolveEuroleagueDisplayName, resolveEuroleagueLogoSlug, resolveEuroleagueLogoUrl } from "@/lib/teamLogos";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const sortOptions = [
  { label: "Last 5 hit rate", value: "L5" },
  { label: "Last 10 hit rate", value: "L10" },
  { label: "Last 15 hit rate", value: "L15" },
  { label: "Last 20 hit rate", value: "L20" },
  { label: "L5 EDGE", value: "vL5" },
  { label: "L10 EDGE", value: "vL10" },
  { label: "L15 EDGE", value: "vL15" },
  { label: "L20 EDGE", value: "vL20" },
] as const;

const scopeOptions = [
  { label: "MAIN PROPS", value: "MAIN" },
  { label: "ALT PROPS", value: "ALT" },
  { label: "ALL PROPS", value: "ALL" },
] as const;

const bookOptions = [
  { label: "ALL BOOKMAKERS", value: "all" },
  { label: "Stoiximan", value: "Stoiximan" },
  { label: "Novibet", value: "Novibet" },
  { label: "Pamestoixima", value: "Pamestoixima" },
  { label: "Bwin", value: "Bwin" },
];

type MatchOption = { label: string; value: string };


function compactMatchLabel(label: string): string {
  const s = String(label || "").trim();
  if (!s) return "MATCH";

  // keep only the "X vs Y" core and drop noise words
  const cleaned = s
    .replace(/\bBasketball\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // If we already have " vs ", keep it. Otherwise keep the first part.
  const core = cleaned.includes(" vs ") ? cleaned : cleaned.split(" - ")[0] || cleaned;

  // Hard cap for mobile so the trigger can't expand and overlap neighbors.
  const max = 22;
  if (core.length <= max) return core;
  return core.slice(0, max - 1).trimEnd() + "…";
}


function useOutsideClick(
  refs: Array<{ current: HTMLElement | null }>,
  onOutside: () => void
) {
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      const inside = refs.some((r) =>
        r.current ? r.current.contains(t) : false
      );
      if (!inside) onOutside();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [refs, onOutside]);
}

function PropCategoryDropdown() {
  const s = useFilters();
  const opts = useFilters((x) => x.propCategoryOptions);
  const selected = useFilters((x) => x.propCategories);

  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(
    null
  );

  useOutsideClick([btnRef as any, popRef as any], () => setOpen(false));

  useLayoutEffect(() => {
    if (!open) return;
    const el = btnRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 328)); // keep inside viewport
      const top = Math.min(r.bottom + 8, window.innerHeight - 16);
      setPopPos({ left, top });
    };

    update();
    window.addEventListener("resize", update);
    // capture scroll on window + any scrollable parents
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const summary = useMemo(() => {
    if (!selected?.length) return "ALL";
    if (selected.length === 1) return selected[0];
    return `${selected.length} selected`;
  }, [selected]);

  const allActive = !selected || selected.length === 0;

  function toggleAll() {
    s.set("propCategories", []); // empty => ALL
  }

  function toggleOne(cat: string) {
    const cur = Array.isArray(selected) ? selected : [];
    const has = cur.includes(cat);
    const next = has ? cur.filter((x) => x !== cat) : [...cur, cat];
    s.set("propCategories", next);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "h-[40px] min-w-[260px] rounded-full border border-stroke bg-white/6 px-4",
          "text-[13px] text-white/90 flex items-center justify-between gap-3",
          "hover:bg-white/8 transition"
        )}
        title="PROP"
      >
        <span className="truncate">
          <span className="text-white/70 mr-2">PROP CATEGORY</span>
          <span className="text-white">{summary}</span>
        </span>
        <span className="text-white/60">▾</span>
      </button>

      {open
        ? createPortal(
            <div
              ref={popRef}
              style={{
                position: "fixed",
                left: popPos?.left ?? 8,
                top: popPos?.top ?? 56,
                width: 320,
                zIndex: 9999,
              }}
              className="max-h-[360px] overflow-auto rounded-2xl border border-stroke bg-bg/95 backdrop-blur-xl shadow-glow p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <label
                className={clsx(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
                  "hover:bg-white/6 cursor-pointer"
                )}
              >
                <div className="text-[13px] text-white/90">ALL</div>
                <input
                  type="checkbox"
                  checked={allActive}
                  onChange={toggleAll}
                  className="h-4 w-4"
                />
              </label>

              <div className="my-2 h-px bg-white/10" />

              {(opts || []).map((cat) => {
                const checked = selected?.includes(cat) ?? false;
                return (
                  <label
                    key={cat}
                    className={clsx(
                      "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
                      "hover:bg-white/6 cursor-pointer"
                    )}
                  >
                    <div className="text-[13px] text-white/90 truncate">
                      {cat}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(cat)}
                      className="h-4 w-4"
                    />
                  </label>
                );
              })}

              {!opts || opts.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-white/55">
                  No categories yet (load feed first).
                </div>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}


function PlayerDropdown() {
  const s = useFilters();
  const players = useFilters((x) => x.playerOptions) as any[];
  const selectedPlayers = useFilters((x) => (x as any).selectedPlayers) as string[] | undefined;
  const selectedTeam = useFilters((x) => (x as any).selectedTeam) as string | null | undefined;
  const search = useFilters((x) => (x as any).playerSearch) as string | undefined;

  const [open, setOpen] = useState(false);
  const [showTeams, setShowTeams] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(null);

  useOutsideClick([btnRef as any, popRef as any], () => {
    setOpen(false);
    setShowTeams(false);
  });

  useLayoutEffect(() => {
    if (!open) return;
    const el = btnRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 368));
      const top = Math.min(r.bottom + 8, window.innerHeight - 16);
      setPopPos({ left, top });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const allActive = (!selectedPlayers || selectedPlayers.length === 0) && !selectedTeam;

  const presentTeams = useMemo(() => {
    const canonical = Object.keys(teamCanonical as any);

    if (canonical.length) {
      const out = canonical
        .map((slug) => ({
          slug,
          display: resolveEuroleagueDisplayName(slug) ?? slug,
          url: resolveEuroleagueLogoUrl(slug),
        }))
        // alphabetical by display name (surname-style expectation: stable, A–Z)
        .sort((a, b) => a.display.localeCompare(b.display, undefined, { sensitivity: "base" }));

      return out;
    }

    // fallback: derive from whatever teams are present in the feed
    const seen = new Set<string>();
    const out: Array<{ slug: string; display: string; url?: string }> = [];
    for (const p of players || []) {
      const slug = resolveEuroleagueLogoSlug(p.team) ?? String(p.team ?? "");
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      out.push({
        slug,
        display: resolveEuroleagueDisplayName(slug) ?? slug,
        url: resolveEuroleagueLogoUrl(slug),
      });
    }
    out.sort((a, b) => a.display.localeCompare(b.display, undefined, { sensitivity: "base" }));
    return out;
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const q = String(search ?? "").trim().toLowerCase();
    const teamSlug = selectedTeam ? String(selectedTeam) : null;

    const getTeamSlug = (p: any): string => {
      // Prefer canonical keys coming from the feed normalization (if present).
      const direct =
        p?.teamKey ??
        p?.team_key ??
        p?.teamSlug ??
        p?.team_slug ??
        p?.__teamKey ??
        p?.__team_key;
      if (direct) return String(direct);

      // If we have a logo path/url like /logos/euroleague/<slug>.png, extract <slug>.
      const logo =
        p?.teamLogo ??
        p?.team_logo ??
        p?.logo ??
        p?.team?.logo ??
        p?.team?.logoUrl ??
        p?.team?.logo_url ??
        p?.team?.logoPath ??
        p?.team?.logo_path;
      if (typeof logo === "string") {
        const mm = logo.match(/\/logos\/euroleague\/([^\/]+)\.(png|svg|webp|jpg|jpeg)$/i);
        if (mm?.[1]) return mm[1];
      }

      // Finally: try to resolve from team labels/codes.
      const candidates = [
        p?.team,
        p?.teamName,
        p?.team_name,
        p?.team?.name,
        p?.team?.abbr,
        p?.team?.code,
        p?.teamCode,
        p?.team_code,
      ].filter(Boolean);

      for (const c of candidates) {
        const slug = resolveEuroleagueLogoSlug(String(c));
        if (slug) return slug;
      }

      return String(p?.team ?? "");
    };

    const arr = (players || []).filter((p) => {
      if (teamSlug) {
        const ps = getTeamSlug(p);
        if (ps !== teamSlug) return false;
      }
      if (!q) return true;
      const sname = String(p.surname ?? "").toLowerCase();
      return sname.startsWith(q);
    });

    arr.sort((a, b) => {
      const sa = String(a.surname ?? a.name ?? "").toLowerCase();
      const sb = String(b.surname ?? b.name ?? "").toLowerCase();
      if (sa < sb) return -1;
      if (sa > sb) return 1;
      const na = String(a.name ?? "").toLowerCase();
      const nb = String(b.name ?? "").toLowerCase();
      return na.localeCompare(nb);
    });

    return arr;
  }, [players, search, selectedTeam]);

  function resetAll() {
    s.set("selectedPlayers" as any, []);
    s.set("selectedTeam" as any, null);
    s.set("playerSearch" as any, "");
  }

  function togglePlayer(key: string) {
    const cur = Array.isArray(selectedPlayers) ? selectedPlayers : [];
    const has = cur.includes(key);
    const next = has ? cur.filter((x) => x !== key) : [...cur, key];
    s.set("selectedPlayers" as any, next);
  }

  function pickTeam(slug: string) {
    s.set("selectedTeam" as any, slug ? slug : null);
    s.set("selectedPlayers" as any, []); // keep semantics: ALL PLAYERS (within team)
    setShowTeams(false);
  }

  const summary = useMemo(() => {
    if (allActive) return "ALL PLAYERS";
    if (selectedPlayers && selectedPlayers.length === 1) {
      const p = (players || []).find((x) => x.key === selectedPlayers[0]);
      return (p?.surname && p?.name) ? `${p.surname} ${p.name}` : (p?.surname ?? p?.name ?? "1 selected");
    }
    if (selectedPlayers && selectedPlayers.length > 1) return `${selectedPlayers.length} selected`;
    if (selectedTeam) {
      const d = resolveEuroleagueDisplayName(selectedTeam) ?? selectedTeam;
      const short = String(d)
        .trim()
        .split(/\s+/)[0] || String(selectedTeam).split("_")[0] || String(d);
      return `ALL ${short.toUpperCase()} PLAYERS`;
    }
    return "ALL PLAYERS";
  }, [allActive, selectedPlayers, selectedTeam, players]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "h-[40px] min-w-[260px] rounded-full border border-stroke bg-white/6 px-4",
          "text-[13px] text-white/90 flex items-center justify-between gap-3",
          "hover:bg-white/8 transition"
        )}
        title="PLAYER"
      >
        <span className="truncate">
          <span className="text-white/70 mr-2">PLAYER</span>
          <span className="text-white">{summary}</span>
        </span>
        <span className="text-white/60">▾</span>
      </button>

      {open
        ? createPortal(
            <div
              ref={popRef}
              style={{
                position: "fixed",
                left: popPos?.left ?? 8,
                top: popPos?.top ?? 56,
                width: 360,
                zIndex: 9999,
              }}
              className="max-h-[520px] overflow-auto rounded-2xl border border-stroke bg-bg/95 backdrop-blur-xl shadow-glow p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <label
                className={clsx(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
                  "hover:bg-white/6 cursor-pointer"
                )}
              >
                <div className="text-[13px] text-white/90">ALL PLAYERS</div>
                <input
                  type="checkbox"
                  checked={allActive}
                  onChange={resetAll}
                  className="h-4 w-4"
                />
              </label>

              <div className="my-2 h-px bg-white/10" />

              <div className="px-2 pb-2">
                <button
                  type="button"
                  onClick={() => setShowTeams((v) => !v)}
                  className={clsx(
                    "w-full rounded-xl border border-stroke px-3 py-2 text-[12px] text-white/90",
                    "bg-white/6 hover:bg-white/8 transition flex items-center justify-between"
                  )}
                >
                  <span>BY TEAM</span>
                  <span className="text-white/60">{showTeams ? "▴" : "▾"}</span>
                </button>

                {showTeams ? (
                  <div className="mt-2 rounded-xl border border-stroke bg-white/4 p-2">
                                        <label
                      className={clsx(
                        "mb-2 flex items-center justify-between gap-3 rounded-xl px-3 py-2",
                        "hover:bg-white/6 cursor-pointer"
                      )}
                    >
                      <div className="text-[12px] text-white/90">ALL TEAMS</div>
                      <input
                        type="checkbox"
                        checked={!selectedTeam}
                        onChange={() => pickTeam("")}
                        className="h-4 w-4"
                      />
                    </label>

<div className="grid grid-cols-4 gap-2">
                      {presentTeams.map((t) => {
                        const active = String(selectedTeam ?? "") === t.slug;
                        return (
                          <button
                            key={t.slug}
                            type="button"
                            onClick={() => pickTeam(t.slug)}
                            className={clsx(
                              "rounded-xl border border-stroke p-2 flex items-center justify-center",
                              "hover:bg-white/8 transition",
                              active ? "bg-white/10" : "bg-transparent"
                            )}
                            title={t.display}
                          >
                            {t.url ? (
                              <img
                                src={t.url}
                                alt={t.display}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <span className="text-[11px] text-white/70">{t.display}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-[11px] text-white/55">
                      Tip: selecting a team shows only players from that team with available props.
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="my-2 h-px bg-white/10" />

              <div className="px-2">
                <div className="text-[12px] text-white/70 mb-1">SEARCH</div>
                <Input
                  value={search ?? ""}
                  onChange={(e) => s.set("playerSearch" as any, e.target.value)}
                  className="w-full"
                  placeholder="Type surname…"
                />

                {String(search ?? "").trim() ? (
                  <div className="mt-2 rounded-xl border border-stroke bg-white/4">
                    {(filteredPlayers.slice(0, 8) || []).map((p) => {
                      const checked = (selectedPlayers || []).includes(p.key);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => togglePlayer(p.key)}
                          className={clsx(
                            "w-full flex items-center justify-between gap-3 px-3 py-2 text-left",
                            "hover:bg-white/6 transition"
                          )}
                        >
                          <div className="text-[13px] text-white/90 truncate">
                            {p.surname} <span className="text-white/60">{p.name}</span>
                          </div>
                          <input type="checkbox" readOnly checked={checked} className="h-4 w-4" />
                        </button>
                      );
                    })}
                    {filteredPlayers.length === 0 ? (
                      <div className="px-3 py-2 text-[12px] text-white/55">No results.</div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {!String(search ?? "").trim() ? (
                <>
                  <div className="my-2 h-px bg-white/10" />

                  <div className="px-1">
                    <div className="px-2 pb-1 text-[12px] text-white/70">
                      PLAYERS (A–Z)
                    </div>

                {filteredPlayers.map((p) => {
                  const checked = (selectedPlayers || []).includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className={clsx(
                        "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
                        "hover:bg-white/6 cursor-pointer"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] text-white/90 truncate">
                          {p.surname} {p.name}
                        </div>
                        <div className="text-[11px] text-white/55 truncate">
                          {resolveEuroleagueDisplayName(p.team) ?? p.team}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePlayer(p.key)}
                        className="h-4 w-4"
                      />
                    </label>
                  );
                })}

                {(!players || players.length === 0) ? (
                  <div className="px-3 py-2 text-[12px] text-white/55">
                    No players yet (load feed first).
                  </div>
                ) : null}
                  </div>
                </>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function TopBar() {
  const s = useFilters();

  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([
    { label: "MATCH", value: "all" },
  ]); 

  useEffect(() => {
    let alive = true;

    const qs =
      s.bookmaker && s.bookmaker !== "all"
        ? `?bookmaker=${encodeURIComponent(s.bookmaker)}`
        : "";

    fetch(`${API_BASE}/api/upcoming-matches${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data)) {
          setMatchOptions([{ label: "MATCH", value: "all" }, ...data]);
        } else {
          setMatchOptions([{ label: "MATCH", value: "all" }]);
        }
      })
      .catch(() => {
        if (!alive) return;
        setMatchOptions([{ label: "MATCH", value: "all" }]);
      });

    return () => {
      alive = false;
    };
  }, [s.bookmaker]);

  const safeMatchOptions = useMemo(() => {
    const curr = s.match || "all";

    // Normalize labels (so MATCH trigger stays small on mobile) + dedupe by value.
    const seen = new Set<string>();
    const normalized: MatchOption[] = [];
    for (const o of matchOptions || []) {
      const value = String((o as any)?.value ?? "");
      const label = compactMatchLabel(String((o as any)?.label ?? ""));
      if (!value) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      normalized.push({ label, value });
    }

    // Ensure the "all" option exists and is first.
    if (!seen.has("all")) normalized.unshift({ label: "MATCH", value: "all" });
    else {
      // move "all" to front
      const idx = normalized.findIndex((x) => x.value === "all");
      if (idx > 0) {
        const [all] = normalized.splice(idx, 1);
        normalized.unshift(all);
      }
      // Make sure label is exactly "MATCH"
      normalized[0] = { ...normalized[0], label: "MATCH" };
    }

    const exists = normalized.some((o) => o.value === curr);
    if (exists) return normalized;

    // If current match isn't in options, prepend a safe compact label.
    return [{ label: compactMatchLabel(String(curr)), value: String(curr) }, ...normalized];
  }, [matchOptions, s.match]);

  return (
    <div className="sticky top-0 z-20 border-b border-stroke bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-2">
          {/* Row 1 */}
          <div
            className="flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] text-[12px]"
          >
            <div className="w-[150px] shrink-0">
              <Select
              value={s.match}
              onChange={(v) => s.set("match", v as any)}
              options={safeMatchOptions as any}
            />
            </div>
            <Select
              value={s.bookmaker}
              onChange={(v) => s.set("bookmaker", v)}
              options={bookOptions}
            />
            <Select
              value={s.scope}
              onChange={(v) => s.set("scope", v as PropsScope)}
              options={scopeOptions as any}
            />

            <div className="flex items-center gap-2 rounded-full border border-stroke bg-white/6 px-2 py-1.5">
              <button
                type="button"
                onClick={() => s.set("sortByOdds", !s.sortByOdds)}
                className={clsx(
                  "rounded-full px-2 py-1 text-[12px] transition",
                  s.sortByOdds
                    ? "bg-white/14 text-white"
                    : "bg-transparent text-white/70 hover:bg-white/8"
                )}
                title="Sort by Odds"
              >
                Odds
              </button>
              <div className="w-[90px]">
                <Input
                  className="text-center"
                  value={s.oddsMin}
                  onChange={(e) => s.set("oddsMin", e.target.value)}
                />
              </div>
              <span className="opacity-50 text-[12px]">—</span>
              <div className="w-[90px]">
                <Input
                  className="text-center"
                  value={s.oddsMax}
                  onChange={(e) => s.set("oddsMax", e.target.value)}
                />
              </div>
            </div>

            {/* anchor for ASC/DESC on row 2 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => s.set("sortByLastN", !s.sortByLastN)}
                className={clsx(
                  "rounded-full px-2 py-1 text-[12px] transition",
                  s.sortByLastN
                    ? "bg-white/14 text-white"
                    : "bg-transparent text-white/70 hover:bg-white/8"
                )}
                title="Sort by Last N hit-rate"
              >
                Last N
              </button>
              <Select
                value={s.sortKey}
                onChange={(v) => s.set("sortKey", v as SortKey)}
                options={sortOptions as any}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="min-h-[40px]">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] text-[12px]">
              <PlayerDropdown />
              <PropCategoryDropdown />
              <Toggle
                value={s.sortDir}
                onChange={(v) => s.set("sortDir", v)}
                leftLabel="ASC"
                rightLabel="DESC"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}