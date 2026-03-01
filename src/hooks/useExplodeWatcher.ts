import { useEffect } from "react";
import { db } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("explode");

const deleteExpiredConvo = async (convoId: string) => {
  log.trace("deleteExpiredConvo", { convoId });
  await db.avatars.where("convoId").equals(convoId).delete();
  await db.convos.delete(convoId);
  log.info("expired convo deleted", { convoId });
};

export const useExplodeWatcher = () => {
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
          deleteExpiredConvo(id).catch((err: unknown) => {
            log.error("failed to delete expired convo", { convoId: id }, err);
          });
        }
      }
    };

    return () => {
      log.trace("terminating explode watcher worker");
      worker.terminate();
    };
  }, []);
};
