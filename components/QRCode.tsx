"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

export function QRCode({
  value,
  size = 176,
}: Readonly<{ value: string; size?: number }>) {
  const [resolved, setResolved] = useState<{ value: string; dataUrl: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0b1220", light: "#ffffff" },
    }).then((dataUrl) => {
      if (!cancelled) setResolved({ value, dataUrl });
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  const dataUrl = resolved?.value === value ? resolved.dataUrl : null;

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse rounded-lg bg-muted"
      />
    );
  }

  // next/image doesn't support data: URLs - a plain img is the right tool here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} width={size} height={size} alt="QR-code" className="rounded-lg" />;
}
