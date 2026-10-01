import type { MetadataRoute } from "next";
import { BASE } from "@/lib/countries";

// Static export needs this to be generated at build time
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dünya Ülkeleri Oyunu",
    short_name: "Ülkeler",
    description: "Dünyadaki tüm ülkeleri öğrenin - interaktif harita oyunu",
    start_url: `${BASE}/`,
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [{ src: `${BASE}/icon.svg`, sizes: "any", type: "image/svg+xml" }],
  };
}
