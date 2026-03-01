import { Group as XmtpGroup, type Conversation } from "@xmtp/browser-sdk";
import { db } from "@/db";
import { updateExpiresAt } from "@/utils/appData";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("explode");

export const setExplodeTimer = async (
  conversation: Conversation,
  convoId: string,
  expiresAt: Date,
) => {
  log.trace("setExplodeTimer", { convoId, expiresAt: expiresAt.toISOString() });
  if (!(conversation instanceof XmtpGroup)) {
    throw new Error("Explode is only supported for group conversations");
  }

  const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);

  // Update local Dexie first for instant UI feedback
  await updateConvo(convoId, { expiresAtUnix });

  // Sync to other members via XMTP appData (network call)
  await updateExpiresAt(conversation, BigInt(expiresAtUnix));
  log.info("explode timer set", { convoId, expiresAtUnix });

  // If already expired, delete immediately instead of waiting for worker
  if (expiresAtUnix <= Math.floor(Date.now() / 1000)) {
    log.info("already expired, deleting immediately", { convoId });
    await db.avatars.where("convoId").equals(convoId).delete();
    await db.convos.delete(convoId);
  }
};

export const getNextSunday = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};
