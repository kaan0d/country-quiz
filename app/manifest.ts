import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dünya Ülkeleri Oyunu",
    short_name: "Ülkeler",
    description: "Dünyadaki tüm ülkeleri öğrenin - interaktif harita oyunu",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
