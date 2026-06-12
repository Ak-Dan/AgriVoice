import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter, isAdminAuthorized } from "./backendGuards.ts";

describe("backend guards", () => {
  it("allows requests inside the rate-limit window and blocks overflow", () => {
    let now = 1_000;
    const limiter = new FixedWindowRateLimiter({
      maxRequests: 2,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client").allowed).toBe(false);

    now = 2_001;
    expect(limiter.check("client").allowed).toBe(true);
  });

  it("validates admin API keys without accepting missing keys", () => {
    expect(
      isAdminAuthorized(
        { headers: { "x-admin-api-key": "secret" } },
        { ADMIN_API_KEY: "secret" },
      ),
    ).toBe(true);

    expect(
      isAdminAuthorized(
        { headers: { "x-admin-api-key": "wrong" } },
        { ADMIN_API_KEY: "secret" },
      ),
    ).toBe(false);

    expect(
      isAdminAuthorized(
        { headers: { "x-admin-api-key": "secret" } },
        {},
      ),
    ).toBe(false);
  });
});
