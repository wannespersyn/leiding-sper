"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconSettings, IconUser } from "./icons";

export function BottomNav({
  personId,
  isAdmin,
}: {
  personId: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Overzicht", icon: IconHome, match: (p: string) => p === "/" },
    {
      href: `/person/${personId}`,
      label: "Profiel",
      icon: IconUser,
      match: (p: string) => p.startsWith("/person/"),
    },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Beheer",
            icon: IconSettings,
            match: (p: string) => p.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <nav className="sticky bottom-0 z-10 flex justify-around border-t border-border bg-surface pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-4 py-1 text-xs font-medium ${
              active ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
