import { RateLimiterMemory } from "rate-limiter-flexible";

// 30 requests per 60 seconds, keyed by path + IP
const limiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  keyPrefix: "api",
});

export async function checkRateLimit(request: Request): Promise<boolean> {
  const path = new URL(request.url).pathname;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  try {
    await limiter.consume(`${path}:${ip}`);
    return true;
  } catch {
    return false;
  }
}
