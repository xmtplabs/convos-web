import { createFileRoute } from "@tanstack/react-router";
import { createLogger } from "@/utils/log";
import {
  getNotificationsClient,
  isValidInstallationId,
} from "@/utils/notifications.server";
import { checkRateLimit } from "@/utils/rateLimit";

const log = createLogger("notifications-api-unsubscribe");

type UnsubscribeRequestBody = {
  installationId: string;
};

export const Route = createFileRoute("/api/v1/notifications/unsubscribe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        log.info("POST unsubscribe");

        if (!(await checkRateLimit(request))) {
          log.warn("rate limited");
          return new Response("Too many requests", { status: 429 });
        }

        const client = getNotificationsClient();
        if (!client) {
          log.error("notifications client not configured");
          return new Response("Notifications not configured", {
            status: 500,
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          log.warn("invalid JSON body");
          return new Response("Invalid JSON", { status: 400 });
        }

        const { installationId } = body as UnsubscribeRequestBody;

        if (!isValidInstallationId(installationId)) {
          log.warn("invalid installationId", installationId);
          return new Response("Invalid installationId", { status: 400 });
        }

        log.info("deleting", installationId);

        try {
          await client.delete(installationId);
          log.info("deleted", installationId);
          return Response.json({ ok: true });
        } catch (err) {
          log.error("unsubscribe failed", installationId, err);
          return new Response("Notifications server error", { status: 502 });
        }
      },
    },
  },
});
