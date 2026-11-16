import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { Database } from "./types";

// neon-serverless (Pool/WebSocket) é o driver que aceita transação interativa;
// neon-http não serve para as escritas com trava de linha.
function createDb(): Database {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }
  return drizzle({ client: new Pool({ connectionString }) });
}

let instance: Database | undefined;

export function getDb(): Database {
  instance ??= createDb();
  return instance;
}
