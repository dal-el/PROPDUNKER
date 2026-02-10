import { clsx } from "clsx";

export function Toggle({
  value,
  onChange,
  leftLabel="Asc",
  rightLabel="Desc",
}:{
  value: "asc"|"desc";
  onChange: (v:"asc"|"desc")=>void;
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-stroke bg-white/6 p-0.5">
      <button
        onClick={() => onChange("asc")}
        className={clsx("rounded-full px-3 py-1.5 text-[13px] transition",
          value==="asc" ? "bg-white/14" : "opacity-70 hover:opacity-100")}
      >
        {leftLabel}
      </button>
      <button
        onClick={() => onChange("desc")}
        className={clsx("rounded-full px-3 py-1.5 text-[13px] transition",
          value==="desc" ? "bg-white/14" : "opacity-70 hover:opacity-100")}
      >
        {rightLabel}
      </button>
    </div>
  );
}
