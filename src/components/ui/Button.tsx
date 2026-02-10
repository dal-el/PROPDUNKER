import { clsx } from "clsx";
import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
  size?: "sm" | "md";
};

export function Button({ className, variant="default", size="md", ...props }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full border border-stroke px-3 py-2 text-sm transition",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
        variant === "default" && "bg-white/10 hover:bg-white/14",
        variant === "ghost" && "bg-transparent hover:bg-white/6",
        size === "sm" && "px-2.5 py-1.5 text-[13px]",
        className
      )}
      {...props}
    />
  );
}
