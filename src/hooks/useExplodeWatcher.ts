import type { Client } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import { useXmtp } from "@/hooks/useXmtp";
import { cleanUpExplodedConvo } from "@/utils/explode";
import { createLogger } from "@/utils/log";

const log = createLogger("explode");

const deleteExpiredConvo = async (
  client: Client | null,
  convoId: string,
  xmtpId: string,
) => {
  log.trace("deleteExpiredConvo", { convoId, xmtpId });
  if (!client?.inboxId) return;

  try {
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
  }
};

export const useExplodeWatcher = () => {
  const { client } = useXmtp();

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
          deleteExpiredConvo(client, id, xmtpId).catch((err: unknown) => {
            log.error("failed to delete expired convo", { convoId: id }, err);
          });
        }
      }
    };

    return () => {
      log.trace("terminating explode worker");
      worker.terminate();
    };
  }, [client]);
};
