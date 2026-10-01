// Served from kaandinc.com/country-quiz by GitHub Pages, so the build is static and lives under a sub-path
const basePath = "/country-quiz";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  // Plain <img> and fetch URLs are not prefixed by Next, so the app reads the base path from here
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
