import { ChevronDown } from "lucide-react";
import * as React from "react";
import { clsx } from "clsx";

type Option = { label: string; value: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
};

export function Select({ value, onChange, options, className }: Props) {
  return (
    <label className={clsx("relative inline-flex items-center", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          "appearance-none rounded-full border border-stroke bg-white/6 px-3 py-2 pr-8 text-[13px]",
          "focus:outline-none focus:ring-2 focus:ring-white/20"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 opacity-70" />
    </label>
  );
}
