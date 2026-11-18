import { getDb } from "@/shared/db/client";
import { runSeed, seedSummary } from "./seed/run-seed";

// O seed nunca roda contra produção: usa o DATABASE_URL do .env.local (pnpm db:seed).
console.log(seedSummary(await runSeed(getDb())));
// O Pool do Neon segura o processo aberto.
process.exit(0);
