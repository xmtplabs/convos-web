import { createFileRoute } from "@tanstack/react-router";
import { createLogger } from "@/utils/log";
import {
  getNotificationsClient,
  isValidInstallationId,
  isValidSubscription,
  isValidTopic,
} from "@/utils/notifications.server";
import { checkRateLimit } from "@/utils/rateLimit";

const log = createLogger("notifications-api-subscribe");

type SubscribeRequestBody = {
  installationId: string;
  subscription: { endpoint: string; p256dh: string; auth: string };
  topic: string;
  hmacKeys?: { thirtyDayPeriodsSinceEpoch: number; key: string }[];
  isSilent?: boolean;
};

export const Route = createFileRoute("/api/v1/notifications/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        log.info("POST subscribe");

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
          log.error("invalid JSON body");
          return new Response("Invalid JSON", { status: 400 });
        }

        const { installationId, subscription, topic, hmacKeys, isSilent } =
          body as SubscribeRequestBody;

        if (!isValidInstallationId(installationId)) {
          log.warn("invalid installationId");
          return new Response("Invalid installationId", { status: 400 });
        }
        if (!isValidSubscription(subscription)) {
          log.warn("invalid subscription");
          return new Response("Invalid subscription", { status: 400 });
        }
        if (!isValidTopic(topic)) {
          log.warn("invalid topic");
          return new Response("Invalid topic", { status: 400 });
        }

        log.info("registering");

        try {
          await client.register(installationId, {
            kind: "webPush",
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          });
          log.info("registered");

          const decodedHmacKeys = Array.isArray(hmacKeys)
            ? hmacKeys.map((k) => ({
                thirtyDayPeriodsSinceEpoch: k.thirtyDayPeriodsSinceEpoch,
                key: Uint8Array.from(atob(k.key), (c) => c.charCodeAt(0)),
              }))
            : undefined;

          await client.subscribe(installationId, [
            {
              topic,
              hmacKeys: decodedHmacKeys,
              isSilent: isSilent === true ? true : undefined,
            },
          ]);
          log.info("subscribed");

          return Response.json({ ok: true });
        } catch (err) {
          log.error("subscribe failed", err);
          return new Response("Notifications server error", { status: 502 });
        }
      },
    },
  },
});
