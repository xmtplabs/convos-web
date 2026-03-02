import type { Client } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import { useClient } from "@/hooks/useClient";
import { cleanUpExplodedConvo } from "@/utils/explode";
import { createLogger } from "@/utils/log";

const log = createLogger("explode");

const deleteExpiredConvo = async (client: Client | null, convoId: string) => {
  log.trace("deleteExpiredConvo", { convoId });
  if (!client?.inboxId) return;

  try {
    const conversation =
      await client.conversations.getConversationById(convoId);
    if (conversation) {
      await cleanUpExplodedConvo(conversation, convoId, client.inboxId);
    }
  } catch (err: unknown) {
    log.error("failed to clean up expired convo", { convoId }, err);
  }
};

export const useExplodeWatcher = () => {
  const { client } = useClient();

  useEffect(() => {
    log.trace("mounting explode worker");
    const worker = new Worker(
      new URL("../workers/explode.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (
      e: MessageEvent<{ type: string; convoIds: string[] }>,
    ) => {
      if (e.data.type === "convos-expired") {
        const convoIds = e.data.convoIds;
        log.info("worker reported expired convos", { convoIds });
        for (const id of convoIds) {
          deleteExpiredConvo(client, id).catch((err: unknown) => {
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
