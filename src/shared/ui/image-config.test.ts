import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("next.config images", () => {
  it("libera só o host das fotos do Google, por HTTPS", () => {
    expect(nextConfig.images?.remotePatterns).toEqual([
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ]);
    expect(nextConfig.images?.domains).toBeUndefined();
  });
});
