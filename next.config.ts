import type { NextConfig } from "next";
import path from "path";

const isCfPagesBuild = process.env.CF_PAGES_BUILD === "1";

const nextConfig: NextConfig = {
  // Cloudflare Pages: CF_PAGES_BUILD=1 → static export (out/). Otherwise standalone for Docker.
  output: isCfPagesBuild ? "export" : "standalone",
  // Use frontend as trace root so CI (running from frontend/) does not see root lockfile
  outputFileTracingRoot: path.resolve(process.cwd()),
  // Rewrites only used when running next start (standalone). For static export, set NEXT_PUBLIC_API_URL to api.htbx0.xyz.
  ...(isCfPagesBuild
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://backend:8000/api/:path*",
            },
          ];
        },
      }),
};

export default nextConfig;
