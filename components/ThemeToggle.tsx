"use client";

import { useEffect, useState } from "react";
import { IconMonitor, IconMoon, IconSun } from "./icons";

type ThemeSetting = "system" | "light" | "dark";

const ORDER: ThemeSetting[] = ["system", "light", "dark"];
const LABEL: Record<ThemeSetting, string> = {
  system: "Systeem",
  light: "Licht",
  dark: "Donker",
};

function resolve(setting: ThemeSetting): "light" | "dark" {
  if (setting !== "system") return setting;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(setting: ThemeSetting) {
  document.documentElement.dataset.theme = resolve(setting);
}

function readStoredSetting(): ThemeSetting {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function ThemeToggle({
  className,
}: Readonly<{ className?: string }>) {
  const [setting, setSetting] = useState<ThemeSetting>(readStoredSetting);

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
    setSetting(next);
    localStorage.setItem("theme", next);
    apply(next);
  }

  const Icon =
    setting === "light" ? IconSun : setting === "dark" ? IconMoon : IconMonitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Thema: ${LABEL[setting]}. Klik om te wijzigen.`}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground active:opacity-60 ${className ?? ""}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
