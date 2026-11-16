import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/shared/auth";

// Criado sob demanda: o build não exige as variáveis do Better Auth.
export async function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).POST(request);
}
