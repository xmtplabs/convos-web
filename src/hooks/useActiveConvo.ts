import { useEffect } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("active-convo");

let activeXmtpId: string | null = null;

export function postActiveConvo(xmtpId: string | null) {
  navigator.serviceWorker.controller?.postMessage({
    type: "active-convo",
    xmtpId,
  });
}

export function setActiveConvoId(xmtpId: string | null) {
  activeXmtpId = xmtpId;
  postActiveConvo(xmtpId);
  log.trace("set", { xmtpId });
}

export function getActiveConvoId(): string | null {
  return activeXmtpId;
}

export const useActiveConvo = () => {
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        postActiveConvo(null);
      } else if (activeXmtpId) {
        postActiveConvo(activeXmtpId);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
};
