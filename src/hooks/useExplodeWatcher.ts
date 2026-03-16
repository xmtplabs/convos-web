import { useEffect } from "react";
import { useXmtpLock } from "@/hooks/useXmtpLock";
import { deleteExpiredConvo } from "@/utils/explode";
import { createLogger } from "@/utils/log";

const log = createLogger("use-explode-watcher");

// module-level ref so ConvoContext can trigger a refresh
let workerInstance: Worker | null = null;

export const refreshExplodeWorker = () => {
  workerInstance?.postMessage({ type: "refresh" });
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
    workerInstance = worker;

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
        for (const { id } of e.data.convos) {
          deleteExpiredConvo(id).catch((err: unknown) => {
            log.error("failed to delete expired convo", { convoId: id }, err);
          });
        }
      }
    };

    return () => {
      log.trace("terminating explode worker");
      worker.terminate();
      workerInstance = null;
    };
  }, []);
};
