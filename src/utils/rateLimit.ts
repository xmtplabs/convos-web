import { RateLimiterMemory } from "rate-limiter-flexible";
import { createLogger } from "@/utils/log";

const log = createLogger("rate-limit");

// 30 requests per 60 seconds, keyed by path + IP
const limiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  keyPrefix: "api",
});

export async function checkRateLimit(request: Request): Promise<boolean> {
  log.trace("checkRateLimit", { request });
  const path = new URL(request.url).pathname;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  try {
    await limiter.consume(`${path}:${ip}`);
    log.debug("checkRateLimit success", { path, ip });
    return true;
  } catch {
    log.debug("checkRateLimit failure", { path, ip });
    return false;
  }
}
