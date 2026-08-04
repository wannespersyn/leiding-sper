import Link from "next/link";
import { initials } from "@/lib/avatar";

const RANK_COLOR = ["text-accent", "text-muted-foreground", "text-[#c68a4e]"];

export function LeaderboardRow({
  rank,
  personId,
  name,
  value,
}: Readonly<{
  rank: number;
  personId: string;
  name: string;
  value: number;
}>) {
  return (
    <Link
      href={`/person/${personId}`}
      className="flex items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0"
    >
      <span
        className={`w-5 shrink-0 text-center text-xs font-extrabold ${
          RANK_COLOR[rank - 1] ?? "text-muted-foreground"
        }`}
      >
        {rank}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent text-[11px] font-extrabold text-accent">
        {initials(name)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{name}</span>
      <span className="text-sm font-extrabold text-primary">{value}</span>
    </Link>
  );
}
