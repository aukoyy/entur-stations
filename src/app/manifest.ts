import type { MetadataRoute } from "next";

/** Lets "Add to Home Screen" open the board full screen, like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avgangstavle — Kråkstad, Ski og Oslo S",
    short_name: "Avganger",
    description: "Neste togavganger mellom Oslo S og Kråkstad stasjon og Ski stasjon",
    start_url: "/",
    display: "standalone",
    background_color: "#e6e8ed",
    theme_color: "#1e232b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
