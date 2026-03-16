import { findConvosBy } from "@/utils/db";
import { createLogger } from "@/utils/log";

const log = createLogger("explode-worker");

// how often to re-query the DB for expiring convos
const SYNC_INTERVAL = 30_000;
// how often to check cached expiry times against current time
const CHECK_INTERVAL = 1_000;

type ExpiringConvo = { id: string; xmtpId: string; expiresAtUnix: number };

let cache: ExpiringConvo[] = [];

const syncCache = async () => {
  log.trace("syncing cache");
  const expiring = await findConvosBy(
    (c) => c.expiresAtUnix != null && !!c.xmtpId,
  );
  cache = expiring.map((c) => ({
    id: c.id,
    // safe because of the filter above
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    xmtpId: c.xmtpId!,
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    expiresAtUnix: c.expiresAtUnix!,
  }));
  log.trace("cache synced", { count: cache.length });
};

const checkExpired = () => {
  const nowUnix = Math.floor(Date.now() / 1000);
  const expired: { id: string; xmtpId: string }[] = [];
  const remaining: ExpiringConvo[] = [];

  for (const convo of cache) {
    if (convo.expiresAtUnix <= nowUnix) {
      expired.push({ id: convo.id, xmtpId: convo.xmtpId });
    } else {
      remaining.push(convo);
    }
  }

  if (expired.length > 0) {
    cache = remaining;
    log.info("expired convos found", { expired });
    self.postMessage({ type: "convos-expired", convos: expired });
  }
};

// listen for refresh requests from main thread
self.onmessage = (e: MessageEvent<{ type: string }>) => {
  if (e.data.type === "refresh") {
    log.trace("refresh requested");
    syncCache()
      .then(() => {
        checkExpired();
      })
      .catch((err: unknown) => {
        log.error("sync error", err);
      });
  }
};

log.trace("started");

// initial sync, then check every second
syncCache()
  .then(() => {
    checkExpired();
  })
  .catch((err: unknown) => {
    log.error("initial sync error", err);
  });

setInterval(checkExpired, CHECK_INTERVAL);
setInterval(() => {
  syncCache().catch((err: unknown) => {
    log.error("sync error", err);
  });
}, SYNC_INTERVAL);
