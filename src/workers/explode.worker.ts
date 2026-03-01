import { db } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("explode worker");
const POLL_INTERVAL = 1_000;

const checkExpired = async () => {
  log.trace("checking for expired convos");
  const nowUnix = Math.floor(Date.now() / 1000);
  const allConvos = await db.convos.toArray();

  const expiredIds: string[] = [];
  for (const convo of allConvos) {
    if (convo.expiresAtUnix != null && convo.expiresAtUnix <= nowUnix) {
      expiredIds.push(convo.id);
    }
  }

  if (expiredIds.length > 0) {
    log.info("expired convos found", { expiredIds });
    self.postMessage({ type: "convos-expired", convoIds: expiredIds });
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
