type RateLimitBucket = { count: number; resetsAt: number };

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
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || "local";
  const key = `${scope}:${client}`;
  const now = Date.now();
  const bucket = rateLimits.get(key);
  if (!bucket || bucket.resetsAt <= now) {
    rateLimits.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1_000)) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

