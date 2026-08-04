"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] z-50 flex justify-center px-6">
          <div className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-lg">
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
