import { neonConfig } from "@neondatabase/serverless";

// O driver do Neon só fala WebSocket: um Postgres comum (o dos testes e2e) precisa do
// wsproxy na frente. Sem TLS e sem pipeline da senha, porque o proxy é local.
export function routeThroughWsProxy(proxy: string): void {
  neonConfig.wsProxy = proxy;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
}
