import { createLogger } from "@/utils/log";

const log = createLogger("notifications");

function urlBase64ToUint8Array(base64String: string) {
  log.trace("urlBase64ToUint8Array");
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

function keysEqual(a: Uint8Array, b: Uint8Array): boolean {
  log.trace("keysEqual");
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

let cachedVapidKey: string | null = null;

async function getVapidKey(): Promise<string | null> {
  log.trace("getVapidKey");
  if (cachedVapidKey) {
    return cachedVapidKey;
  }

  try {
    const res = await fetch("/api/v1/notifications/vapid-key");
    if (!res.ok) {
      log.warn("failed to fetch VAPID key", { status: res.status });
      return null;
    }
    const data = (await res.json()) as { key: string };
    cachedVapidKey = data.key;
    return cachedVapidKey;
  } catch (err) {
    log.error("failed to fetch VAPID key", err);
    return null;
  }
}

let cachedSubscription: PushSubscription | null = null;

async function ensurePushSubscription(): Promise<PushSubscription | null> {
  log.trace("ensurePushSubscription");
  if (cachedSubscription) {
    return cachedSubscription;
  }

  const vapidKey = await getVapidKey();
  if (!vapidKey) {
    log.error("failed to get VAPID key");
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
  const expectedKey = urlBase64ToUint8Array(vapidKey);

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

// register a single convo for push notifications
export async function registerConvo(
  installationId: string,
  topic: string,
): Promise<boolean> {
  log.trace("registerConvo", { installationId, topic });
  const subscription = await ensurePushSubscription();
  if (!subscription) {
    log.error("failed to ensure push subscription");
    return false;
  }

  const { endpoint, keys } = subscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    log.error("push subscription missing required fields");
    return false;
  }

  log.info("subscribing", { installationId, topic });
  try {
    const res = await fetch("/api/v1/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        installationId,
        subscription: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
        topic,
      }),
    });

    if (!res.ok) {
      log.error("subscribe failed", { status: res.status });
      return false;
    }

    log.info("push registration complete", { installationId });
    return true;
  } catch (err) {
    log.error("subscribe failed", installationId, topic, err);
    return false;
  }
}

// unregister an installation from push notifications
export async function unregisterConvo(installationId: string): Promise<void> {
  log.trace("unregisterConvo", { installationId });
  try {
    const res = await fetch("/api/v1/notifications/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installationId }),
    });

    if (!res.ok) {
      log.error("unsubscribe failed", { status: res.status });
    }
  } catch (err) {
    log.error("unsubscribe failed", installationId, err);
  }
}
