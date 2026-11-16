export type Result<T, C extends string> = { ok: true; data: T } | { ok: false; error: { code: C } };

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export function err<C extends string>(code: C): { ok: false; error: { code: C } } {
  return { ok: false, error: { code } };
}
