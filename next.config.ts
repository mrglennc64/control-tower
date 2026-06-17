import type { NextConfig } from "next";

// When deployed under a subpath (e.g. /crm), set NEXT_PUBLIC_BASE_PATH at
// build AND runtime. Locally it is unset, so the app serves from the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
