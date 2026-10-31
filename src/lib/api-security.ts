import { isIP } from "node:net";

type RateLimitBucket = { count: number; resetsAt: number };
const MAX_RATE_LIMIT_BUCKETS = 4_096;

const globalForRateLimits = globalThis as typeof globalThis & {
  __pbUndergroundRateLimits?: Map<string, RateLimitBucket>;
};

const rateLimits = globalForRateLimits.__pbUndergroundRateLimits ?? new Map<string, RateLimitBucket>();
globalForRateLimits.__pbUndergroundRateLimits = rateLimits;

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function takeRateLimit(request: Request, scope: string, limit = 10, windowMs = 60_000) {
  // Vercel overwrites this header at ingress. Other hosts may opt in only
  // when their trusted proxy does the same; otherwise rate limiting belongs
  // at the ingress where the client's address can be authenticated.
  const trustedProxy = process.env.VERCEL === "1" || process.env.PB_TRUST_PROXY_IP === "1";
  if (!trustedProxy) return { allowed: true, retryAfterSeconds: 0 };
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  if (!forwarded || !isIP(forwarded)) return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1_000) };
  const client = forwarded;
  const key = `${scope}:${client}`;
  const now = Date.now();
  const bucket = rateLimits.get(key);
  if (!bucket || bucket.resetsAt <= now) {
    if (!bucket && rateLimits.size >= MAX_RATE_LIMIT_BUCKETS) {
      for (const [existingKey, existingBucket] of rateLimits) {
        if (existingBucket.resetsAt <= now) rateLimits.delete(existingKey);
      }
      if (rateLimits.size >= MAX_RATE_LIMIT_BUCKETS) return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1_000) };
    }
    rateLimits.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1_000)) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

