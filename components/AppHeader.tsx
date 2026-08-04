"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const ACTION_CLASS_NAME =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/14 text-white ring-1 ring-white/10 transition-transform transition-opacity active:scale-95 active:opacity-75";

export function AppHeader({
  title,
  subtitle,
  leading,
  trailing,
  className,
}: Readonly<{
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}>) {
  const hasLeading = leading !== undefined;

  return (
    <header
      className={`relative rounded-b-3xl bg-linear-to-br from-primary to-primary-dark px-5 py-[max(0.875rem,env(safe-area-inset-top))] text-white shadow-[0_10px_22px_rgba(18,33,61,0.14)] ${className ?? ""}`}
    >
      {hasLeading ? (
        <>
          <div className="flex min-h-[3.25rem] items-center justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center">{leading}</div>

            <div className="flex h-9 w-9 items-center justify-center">
              {trailing ?? <span aria-hidden="true" className="h-9 w-9" />}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-[5.5rem] text-left">
            <div className="mx-auto max-w-[24rem]">
              {subtitle ? (
                <p className="mb-0.5 truncate text-[10px] font-medium tracking-[0.08em] text-white/70">
                  {subtitle}
                </p>
              ) : null}
              <h1 className="truncate text-[1.1rem] font-semibold leading-tight text-white sm:text-[1.15rem]">
                {title}
              </h1>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[3.25rem] items-center justify-between gap-3 text-left">
          <div className="min-w-0 flex-1 pr-2">
            {subtitle ? (
              <p className="mb-0.5 truncate text-[10px] font-medium tracking-[0.08em] text-white/70">
                {subtitle}
              </p>
            ) : null}
            <h1 className="truncate text-[1.1rem] font-semibold leading-tight text-white sm:text-[1.15rem]">
              {title}
            </h1>
          </div>

          <div className="flex h-9 w-9 items-center justify-center">
            {trailing ?? <span aria-hidden="true" className="h-9 w-9" />}
          </div>
        </div>
      )}
    </header>
  );
}

export function HeaderLink({
  href,
  label,
  children,
}: Readonly<{
  href: string;
  label: string;
  children: ReactNode;
}>) {
  return (
    <Link href={href} aria-label={label} className={ACTION_CLASS_NAME}>
      {children}
    </Link>
  );
}

export function HeaderButton({
  onClick,
  label,
  children,
  disabled,
}: Readonly<{
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={ACTION_CLASS_NAME}
    >
      {children}
    </button>
  );
}

export function PageContent({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return <div className={`px-6 ${className ?? ""}`}>{children}</div>;
}