import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in $HOME otherwise confuses inference.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
