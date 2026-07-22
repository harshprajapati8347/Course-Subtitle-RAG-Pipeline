import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js ignores unrelated
  // lockfiles that may exist in parent directories on the machine.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
