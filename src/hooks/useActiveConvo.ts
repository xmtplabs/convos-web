import { useEffect } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("active-convo");

let activeXmtpId: string | null = null;

export const postActiveConvo = (xmtpId: string | null) => {
  log.trace("postActiveConvo", { xmtpId });
  navigator.serviceWorker.controller?.postMessage({
    type: "active-convo",
    xmtpId,
  });
};

export const setActiveConvoId = (xmtpId: string | null) => {
  log.trace("setActiveConvoId", { xmtpId });
  activeXmtpId = xmtpId;
  postActiveConvo(xmtpId);
};

export const getActiveConvoId = () => {
  log.trace("getActiveConvoId");
  return activeXmtpId;
};

export const useActiveConvo = () => {
  useEffect(() => {
    const onVisibilityChange = () => {
      log.trace("onVisibilityChange", {
        visibilityState: document.visibilityState,
      });
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
