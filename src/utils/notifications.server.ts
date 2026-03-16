import { createNotificationsClient } from "@xmtp/notifications-client/node";
import { createLogger } from "@/utils/log";

const log = createLogger("notifications-server");

const HEX_RE = /^[0-9a-f]+$/i;

export function isValidInstallationId(id: unknown): id is string {
  log.trace("isValidInstallationId", { id });
  return (
    typeof id === "string" &&
    id.length >= 1 &&
    id.length <= 128 &&
    HEX_RE.test(id)
  );
}

const TOPIC_RE = /^\/xmtp\/mls\/1\/g-.+$/;

export function isValidTopic(topic: unknown): topic is string {
  log.trace("isValidTopic", { topic });
  return typeof topic === "string" && TOPIC_RE.test(topic);
}

export function isValidSubscription(
  sub: unknown,
): sub is { endpoint: string; p256dh: string; auth: string } {
  log.trace("isValidSubscription", { sub });
  if (typeof sub !== "object" || sub === null) return false;
  const s = sub as Record<string, unknown>;
  return (
    typeof s.endpoint === "string" &&
    typeof s.p256dh === "string" &&
    typeof s.auth === "string" &&
    s.endpoint.length > 0 &&
    s.p256dh.length > 0 &&
    s.auth.length > 0
  );
}

type NotificationsClient = ReturnType<typeof createNotificationsClient>;

let client: NotificationsClient | null = null;

export function getNotificationsClient() {
  log.trace("getNotificationsClient");
  if (!client) {
    const url = process.env.XMTP_NOTIFICATIONS_URL;
    if (!url) {
      log.error("XMTP_NOTIFICATIONS_URL not set");
      return null;
    }
    client = createNotificationsClient({
      baseUrl: url,
      httpVersion: "1.1",
    });
    log.info("client created", url);
  }
  return client;
}
