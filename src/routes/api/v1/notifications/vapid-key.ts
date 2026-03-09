import { createFileRoute } from "@tanstack/react-router";
import { createLogger } from "@/utils/log";
import { checkRateLimit } from "@/utils/rateLimit";

const log = createLogger("notifications-api-vapid-key");

export const Route = createFileRoute("/api/v1/notifications/vapid-key")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        log.info("GET vapid-key");

        if (!(await checkRateLimit(request))) {
          log.warn("rate limited");
          return new Response("Too many requests", { status: 429 });
        }

        const key = process.env.VAPID_PUBLIC_KEY;
        if (!key) {
          log.error("VAPID_PUBLIC_KEY not set");
          return new Response("VAPID key not configured", { status: 500 });
        }

        log.info("returning vapid key");
        return Response.json({ key });
      },
    },
  },
});
