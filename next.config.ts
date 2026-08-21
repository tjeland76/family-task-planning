import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: without this, Turbopack walks up from this
  // directory looking for a lockfile and can pick up an unrelated one in
  // $HOME, which isn't part of this project.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
