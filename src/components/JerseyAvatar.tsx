import * as React from "react";
import { getJerseyTheme } from "@/lib/teams/jerseyThemes";
import type { TeamKey } from "@/lib/teams/teamData";

type Props = {
  playerName: string;
  number: string | number;
  teamName: string;
  teamKey?: TeamKey | null;
  size?: number;
  className?: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function upper(s: string) {
  return (s ?? "").toUpperCase();
}

export function JerseyAvatar({
  playerName,
  number,
  teamName,
  teamKey,
  size = 48,
  className = "",
}: Props) {
  const theme = getJerseyTheme(teamKey ?? null);

  const px = `${size}px`;
  const nameSize = clamp(Math.round(size * 0.18), 9, 16);
  const teamSize = clamp(Math.round(size * 0.16), 8, 14);
  const numSize = clamp(Math.round(size * 0.78), 28, 72);

  const showStripes = !!theme.stripes; // only Barcelona has this

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ width: px, height: px, backgroundColor: theme.base }}
      aria-label={`${playerName} ${number} ${teamName}`}
    >
      {/* Optional Barcelona stripes */}
      {showStripes && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-[18%]"
            style={{ backgroundColor: theme.stripes as string, opacity: 0.95 }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[18%]"
            style={{ backgroundColor: theme.stripes as string, opacity: 0.95 }}
          />
        </>
      )}

      {/* Collar hint */}
      <div
        className="absolute left-3 right-3 top-[6px] h-2"
        style={{ borderBottom: `1px solid rgba(0,0,0,0.18)` }}
      />

      {/* Name */}
      <div
        className="absolute top-[6px] inset-x-1 text-center uppercase"
        style={{
          color: theme.letters,
          fontSize: `${nameSize}px`,
          fontWeight: 800,
          letterSpacing: "0.14em",
        }}
      >
        {upper(playerName)}
      </div>

      {/* Number */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          color: theme.letters,
          fontSize: `${numSize}px`,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {number}
      </div>

      {/* Team name */}
      <div className="absolute inset-x-2 bottom-1">
        <div
          className="mb-1"
          style={{ borderTop: `1px dashed rgba(0,0,0,0.18)` }}
        />
        <div
          className="text-center uppercase"
          style={{
            color: theme.letters,
            fontSize: `${teamSize}px`,
            fontWeight: 700,
            letterSpacing: "0.18em",
          }}
        >
          {upper(teamName)}
        </div>
      </div>

      {/* Inner border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]" />
    </div>
  );
}

export default JerseyAvatar;
