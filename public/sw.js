/* global self, caches */
const CACHE = "convos-cache";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// convo metadata synced from main thread: xmtpId -> { id, name, muted }
let convoMap = {};
let activeXmtpId = null;

// pending decrypt requests: messageId -> { resolve }
const decryptRequests = new Map();

self.addEventListener("message", (e) => {
  if (!e.data) return;
  if (e.data.type === "active-convo") {
    activeXmtpId = e.data.xmtpId || null;
  } else if (e.data.type === "sync-convos") {
    convoMap = e.data.convos || {};
  } else if (e.data.type === "decrypt-result" && e.data.messageId) {
    const pending = decryptRequests.get(e.data.messageId);
    if (pending) {
      decryptRequests.delete(e.data.messageId);
      pending.resolve(
        e.data.skip ? "skip" : { title: e.data.title, body: e.data.body },
      );
    }
  }
});

// extract xmtpId from content topic like /xmtp/mls/1/g-<id>
function xmtpIdFromTopic(contentTopic) {
  if (!contentTopic) return null;
  const match = contentTopic.match(/\/g-([^/]+)/);
  return match ? match[1] : null;
}

// post a message to all open windows
function postToClients(data) {
  return self.clients.matchAll({ type: "window" }).then((clients) => {
    for (const client of clients) {
      client.postMessage(data);
    }
  });
}

function requestDecrypt(xmtpId, payload, timeoutMs = 4000) {
  const messageId = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      decryptRequests.delete(messageId);
      resolve(null);
    }, timeoutMs);

    decryptRequests.set(messageId, {
      resolve: (result) => {
        clearTimeout(timer);
        resolve(result);
      },
    });

    postToClients({
      type: "decrypt-message",
      messageId,
      xmtpId,
      payload,
    });
  });
}

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let payload;
  try {
    payload = e.data.json();
  } catch {
    return;
  }

  const xmtpId = xmtpIdFromTopic(payload.contentTopic);
  if (!xmtpId || xmtpId === activeXmtpId) return;

  const convo = convoMap[xmtpId];
  if (convo && convo.muted) return;

  const genericTitle = convo ? convo.name || "New message" : "New message";

  const notifData = { convoId: convo ? convo.id : null };

  e.waitUntil(
    self.clients
      .matchAll({ type: "window" })
      .then((clients) => {
        if (clients.length === 0) {
          // no open windows (e.g. iOS PWA backgrounded) — show immediately
          return null;
        }
        // notify open windows and attempt decryption
        for (const client of clients) {
          client.postMessage({
            type: "push-received",
            convoId: notifData.convoId,
            xmtpId,
          });
        }
        return requestDecrypt(xmtpId, payload);
      })
      .then((result) => {
        // skip = main thread says don't notify
        if (result === "skip") return;
        const title = result ? result.title : genericTitle;
        const body = result ? result.body : "New message";
        return self.registration.showNotification(title, {
          body,
          icon: "/logo192.png",
          badge: "/logo192.png",
          data: notifData,
        });
      })
      .catch((err) => {
        console.error("[sw] notification error", err);
        return self.registration.showNotification(genericTitle, {
          body: "New message",
          icon: "/logo192.png",
          badge: "/logo192.png",
          data: notifData,
        });
      }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const convoId =
    e.notification.data && e.notification.data.convoId
      ? e.notification.data.convoId
      : null;
  const targetUrl = convoId ? `/convo/${convoId}` : "/";

  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "navigate", url: targetUrl });
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;

  // skip dev server files
  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/__vite") ||
    url.pathname.startsWith("/__tsd/")
  ) {
    return;
  }

  // Hashed assets (e.g. /assets/index-abc123.js) — cache-first
  // New builds produce new filenames, so stale entries are never served.
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Navigation — network-first, fall back to cached shell
  // After a deploy, the fresh HTML references new hashed assets automatically.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/").then((r) => r || fetch(request))),
    );
    return;
  }

  // Other same-origin requests (icons, manifest, etc.) — network-first
  e.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || fetch(request))),
  );
});
