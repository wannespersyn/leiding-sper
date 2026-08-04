import type { BadgeDef } from "@/lib/badges";
import { IconCheck } from "./icons";

export function Badge({ badge }: Readonly<{ badge: BadgeDef }>) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl p-2.5 ${
        badge.unlocked ? "bg-accent-soft" : "bg-muted opacity-55"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          badge.unlocked ? "bg-accent" : "bg-border"
        }`}
      >
        <IconCheck
          className={`h-3 w-3 ${badge.unlocked ? "text-primary-dark" : "text-muted-foreground"}`}
        />
      </span>
      <span className="text-[11px] font-bold leading-tight text-foreground">{badge.label}</span>
    </div>
  );
}
