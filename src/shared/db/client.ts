import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// neon-serverless (Pool/WebSocket) é o driver que aceita transação interativa;
// neon-http não serve para as escritas com trava de linha.
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }
  return drizzle({ client: new Pool({ connectionString }), schema });
}

type Db = ReturnType<typeof createDb>;

let instance: Db | undefined;

export function getDb(): Db {
  instance ??= createDb();
  return instance;
}
