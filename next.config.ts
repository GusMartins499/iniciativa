import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pino usa worker threads e não deve ser empacotado pelo bundler.
  serverExternalPackages: ["pino"],
  // A tela inicial era /entrar e agora é /. Links antigos continuam funcionando
  // (os parâmetros, como ?deleted=1, vão junto).
  async redirects() {
    return [{ source: "/entrar", destination: "/", permanent: true }];
  },
};

export default nextConfig;
