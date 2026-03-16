import { useEffect } from "react";
import { db } from "@/db";
import { useXmtpLock } from "@/hooks/useXmtpLock";
import { cleanUpExplodedConvo } from "@/utils/explode";
import { createLogger } from "@/utils/log";
import { createClient } from "@/utils/xmtp";

const log = createLogger("explode");

const deleteExpiredConvo = async (convoId: string, xmtpId: string) => {
  log.trace("deleteExpiredConvo", { convoId, xmtpId });
  const convo = await db.convos.get(convoId);
  if (!convo) return;

  const client = await createClient(convo.privateKey);
  try {
    if (!client.inboxId) return;
    const conversation = await client.conversations.getConversationById(xmtpId);
    if (conversation) {
      await cleanUpExplodedConvo(
        conversation,
        convoId,
        client.inboxId,
        client.installationId,
      );
    }
  } catch (err: unknown) {
    log.error("failed to clean up expired convo", { convoId }, err);
  } finally {
    client.close();
  }
};

export const useExplodeWatcher = () => {
  // keep reference to ensure provider is available
  useXmtpLock();

  useEffect(() => {
    log.trace("mounting explode worker");
    const worker = new Worker(
      new URL("../workers/explode.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (
      e: MessageEvent<{
        type: string;
        convos: { id: string; xmtpId: string }[];
      }>,
    ) => {
      if (e.data.type === "convos-expired") {
        log.info("worker reported expired convos", {
          convos: e.data.convos,
        });
        for (const { id, xmtpId } of e.data.convos) {
          deleteExpiredConvo(id, xmtpId).catch((err: unknown) => {
            log.error("failed to delete expired convo", { convoId: id }, err);
          });
        }
      }
    };

    return () => {
      log.trace("terminating explode worker");
      worker.terminate();
    };
  }, []);
};
