import { db } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("explode-worker");
const POLL_INTERVAL = 1_000;

const checkExpired = async () => {
  const nowUnix = Math.floor(Date.now() / 1000);
  const allConvos = await db.convos.toArray();

  const expired: { id: string; xmtpId: string }[] = [];
  for (const convo of allConvos) {
    if (
      convo.expiresAtUnix != null &&
      convo.expiresAtUnix <= nowUnix &&
      convo.xmtpId
    ) {
      expired.push({ id: convo.id, xmtpId: convo.xmtpId });
    }
  }

  if (expired.length > 0) {
    log.info("expired convos found", { expired });
    self.postMessage({ type: "convos-expired", convos: expired });
  }
};

const poll = () => {
  checkExpired().catch((err: unknown) => {
    log.error("poll error", err);
  });
};

log.trace("started");
setInterval(poll, POLL_INTERVAL);
poll();
