import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { takeRateLimit } from "@/lib/api-security";

const originalVercel = process.env.VERCEL;
const originalTrustedProxy = process.env.PB_TRUST_PROXY_IP;
const sharedBuckets = (globalThis as typeof globalThis & {
  __pbUndergroundRateLimits?: Map<string, { count: number; resetsAt: number }>;
}).__pbUndergroundRateLimits;

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalTrustedProxy === undefined) delete process.env.PB_TRUST_PROXY_IP;
  else process.env.PB_TRUST_PROXY_IP = originalTrustedProxy;
  sharedBuckets?.clear();
  vi.useRealTimers();
});

describe("public API rate limiting", () => {
  it("does not let an untrusted header deny other clients outside a trusted proxy", () => {
    delete process.env.VERCEL;
    delete process.env.PB_TRUST_PROXY_IP;
    const scope = randomUUID();
    const request = (ip: string) => new Request("http://localhost/api/auth/login", { headers: { "x-forwarded-for": ip } });
    expect(takeRateLimit(request("1.1.1.1"), scope, 1).allowed).toBe(true);
    expect(takeRateLimit(request("2.2.2.2"), scope, 1).allowed).toBe(true);
  });

  it("keeps trusted clients separate and reads the first forwarded address", () => {
    process.env.VERCEL = "1";
    const scope = randomUUID();
    const request = (ip: string) => new Request("https://example.test/api/auth/login", { headers: { "x-forwarded-for": ip } });
    expect(takeRateLimit(request("1.1.1.1, 10.0.0.1"), scope, 1).allowed).toBe(true);
    expect(takeRateLimit(request("1.1.1.1"), scope, 1).allowed).toBe(false);
    expect(takeRateLimit(request("2.2.2.2"), scope, 1).allowed).toBe(true);
  });

  it("rejects a trusted-proxy request without a valid client address", () => {
    process.env.VERCEL = "1";
    const scope = randomUUID();
    const request = new Request("https://example.test/api/auth/login", { headers: { "x-forwarded-for": "not-an-ip" } });
    expect(takeRateLimit(request, scope, 1).allowed).toBe(false);
  });

  it("bounds active buckets and reclaims expired ones", () => {
    process.env.VERCEL = "1";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T00:00:00Z"));
    const scope = randomUUID();
    const request = (index: number) => new Request("https://example.test/api/auth/login", {
      headers: { "x-forwarded-for": `10.0.${Math.floor(index / 256)}.${index % 256}` },
    });
    for (let index = 0; index < 4_096; index += 1) {
      expect(takeRateLimit(request(index), scope, 1).allowed).toBe(true);
    }
    expect(takeRateLimit(request(4_096), scope, 1).allowed).toBe(false);
    expect(sharedBuckets?.size).toBeLessThanOrEqual(4_096);
    vi.advanceTimersByTime(60_001);
    expect(takeRateLimit(request(4_096), scope, 1).allowed).toBe(true);
    expect(sharedBuckets?.size).toBeLessThanOrEqual(4_096);
  });
});
