import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/shared/env";
import type { Database } from "./types";
import { routeThroughWsProxy } from "./ws-proxy";

// neon-serverless (Pool/WebSocket) é o driver que aceita transação interativa;
// neon-http não serve para as escritas com trava de linha.
function createDb(): Database {
  const env = getServerEnv();
  if (env.DATABASE_WS_PROXY) routeThroughWsProxy(env.DATABASE_WS_PROXY);
  return drizzle({ client: new Pool({ connectionString: env.DATABASE_URL }) });
}

let instance: Database | undefined;

export function getDb(): Database {
  instance ??= createDb();
  return instance;
}
