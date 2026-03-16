import { useMatch, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("use-convo-details");

export const useConvoDetails = (convoId: string) => {
  const detailsMatch = useMatch({
    from: "/_app/convo/$convoId/details",
    shouldThrow: false,
  });
  const detailsOpen = !!detailsMatch;
  const navigate = useNavigate();

  const toggleDetails = useCallback(() => {
    log.trace("toggleDetails", { convoId, detailsOpen });
    if (detailsOpen) {
      log.info("details open, navigate to convo", { convoId });
      void navigate({
        to: "/convo/$convoId",
        params: { convoId },
      });
    } else {
      log.info("details closed, navigate to details", { convoId });
      void navigate({
        to: "/convo/$convoId/details",
        params: { convoId },
      });
    }
  }, [detailsOpen, navigate, convoId]);

  return { detailsOpen, toggleDetails };
};
