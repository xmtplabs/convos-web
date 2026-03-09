import { useEffect } from "react";
import { type Convo } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("service-worker-sync");

export function useServiceWorkerSync(convos: Convo[]) {
  useEffect(() => {
    const convosMap: Record<
      string,
      { id: string; name: string; muted: boolean }
    > = {};
    for (const c of convos) {
      if (c.xmtpId) {
        convosMap[c.xmtpId] = {
          id: c.id,
          name: c.name ?? "New Convo",
          muted: !!c.muted,
        };
      }
    }
    log.debug("syncing convos", { count: Object.keys(convosMap).length });
    navigator.serviceWorker.controller?.postMessage({
      type: "sync-convos",
      convos: convosMap,
    });
  }, [convos]);
}
