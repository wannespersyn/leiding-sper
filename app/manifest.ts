import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Staftracker",
    short_name: "Staftracker",
    description: "Streepjes bijhouden voor de leiding.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fa",
    theme_color: "#19428b",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
