import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pino usa worker threads e não deve ser empacotado pelo bundler.
  serverExternalPackages: ["pino"],
};

export default nextConfig;
