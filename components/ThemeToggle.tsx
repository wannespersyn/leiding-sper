"use client";

import { useEffect, useSyncExternalStore } from "react";
import { IconMonitor, IconMoon, IconSun } from "./icons";

type ThemeSetting = "system" | "light" | "dark";

const ORDER: ThemeSetting[] = ["system", "light", "dark"];
const LABEL: Record<ThemeSetting, string> = {
  system: "Systeem",
  light: "Licht",
  dark: "Donker",
};
// Dispatched after we write localStorage ourselves, since the native
// "storage" event only fires in *other* tabs, not the one that wrote it.
const THEME_EVENT = "staftracker-theme-change";

function resolve(setting: ThemeSetting): "light" | "dark" {
  if (setting !== "system") return setting;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(setting: ThemeSetting) {
  document.documentElement.dataset.theme = resolve(setting);
}

function getSnapshot(): ThemeSetting {
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

// No localStorage access during SSR - matches the server-rendered markup so
// hydration doesn't mismatch for anyone who'd already picked Light or Dark.
function getServerSnapshot(): ThemeSetting {
  return "system";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export function ThemeToggle({
  className,
  variant = "default",
}: Readonly<{ className?: string; variant?: "default" | "header" }>) {
  const setting = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") {
        apply("system");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(setting) + 1) % ORDER.length];
    localStorage.setItem("theme", next);
    apply(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const Icon =
    setting === "light" ? IconSun : setting === "dark" ? IconMoon : IconMonitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Thema: ${LABEL[setting]}. Klik om te wijzigen.`}
      className={`flex shrink-0 items-center justify-center rounded-full active:opacity-60 ${variant === "header" ? "h-10 w-10 bg-white/15 text-white ring-1 ring-white/10" : "h-9 w-9 bg-muted text-muted-foreground"} ${className ?? ""}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
