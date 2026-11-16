import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/shared/env";
import type { Database } from "./types";

// neon-serverless (Pool/WebSocket) é o driver que aceita transação interativa;
// neon-http não serve para as escritas com trava de linha.
function createDb(): Database {
  return drizzle({ client: new Pool({ connectionString: getServerEnv().DATABASE_URL }) });
}

let instance: Database | undefined;

export function getDb(): Database {
  instance ??= createDb();
  return instance;
}
