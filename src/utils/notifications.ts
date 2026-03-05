import { createNotificationsClient } from "@xmtp/notifications-client/browser";
import { createLogger } from "@/utils/log";

const log = createLogger("notifications");

const NOTIFICATIONS_URL = import.meta.env.VITE_XMTP_NOTIFICATIONS_URL;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

type NotificationsClient = ReturnType<typeof createNotificationsClient>;

let notificationsClient: NotificationsClient | null = null;

function getClient(): NotificationsClient | null {
  if (!NOTIFICATIONS_URL) {
    log.warn("VITE_XMTP_NOTIFICATIONS_URL not set, skipping");
    return null;
  }
  if (!notificationsClient) {
    notificationsClient = createNotificationsClient({
      baseUrl: NOTIFICATIONS_URL,
    });
  }
  return notificationsClient;
}

// convert a base64url-encoded VAPID key to a Uint8Array for pushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

let cachedSubscription: PushSubscription | null = null;

// request permission and subscribe via pushManager, caching the result.
// if the VAPID key changed since the last subscription, unsubscribe first.
async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (cachedSubscription) return cachedSubscription;

  if (!VAPID_PUBLIC_KEY) {
    log.warn("VITE_VAPID_PUBLIC_KEY not set, skipping push subscription");
    return null;
  }

  if (typeof Notification !== "undefined") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      log.info("permission denied");
      return null;
    }
  }

  const registration = await navigator.serviceWorker.ready;
  // iOS (Declarative Web Push) exposes pushManager on navigator,
  // while other browsers expose it on the service worker registration.
  const pushManager =
    (navigator as unknown as { pushManager?: PushManager }).pushManager ??
    registration.pushManager;
  const expectedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  // check if existing subscription uses a different VAPID key
  const existing = await pushManager.getSubscription();
  if (existing) {
    const existingKey = existing.options.applicationServerKey;
    if (existingKey && !keysEqual(new Uint8Array(existingKey), expectedKey)) {
      log.info("VAPID key changed, resubscribing");
      await existing.unsubscribe();
    } else {
      cachedSubscription = existing;
      return cachedSubscription;
    }
  }

  cachedSubscription = await pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: expectedKey,
  });

  return cachedSubscription;
}

function keysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// register a single convo for push notifications
export async function registerConvo(
  installationId: string,
  topic: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const subscription = await ensurePushSubscription();
  if (!subscription) return false;

  const { endpoint, keys } = subscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    log.error("push subscription missing required fields");
    return false;
  }

  log.info("registering installation", { installationId, endpoint });
  await client.register(installationId, {
    kind: "webPush",
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  log.info("subscribing to topic", { installationId, topic });
  await client.subscribe(installationId, [{ topic }]);

  log.info("push registration complete", { installationId });
  return true;
}

// unregister an installation from push notifications
export async function unregisterConvo(installationId: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  log.info("deleting installation %s", installationId);
  await client.delete(installationId);
}
