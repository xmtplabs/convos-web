import { createFileRoute } from "@tanstack/react-router";
import { createLogger } from "@/utils/log";

const log = createLogger("notifications-api-health");

export const Route = createFileRoute("/api/v1/notifications/health")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.XMTP_NOTIFICATIONS_URL;
        log.info("health check", { url });

        if (!url) {
          return Response.json({
            ok: false,
            error: "XMTP_NOTIFICATIONS_URL not set",
          });
        }

        try {
          const res = await fetch(`${url}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          const status = res.status;
          const body = await res.text().catch(() => "");
          log.info("health response", { status, body });
          return Response.json({ ok: res.ok, status, body, url });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log.error("health check failed", { url, error: message });
          return Response.json({ ok: false, url, error: message });
        }
      },
    },
  },
});
