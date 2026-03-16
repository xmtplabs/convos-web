import { useMatch, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

export const useConvoDetails = (convoId: string) => {
  const detailsMatch = useMatch({
    from: "/_app/convo/$convoId/details",
    shouldThrow: false,
  });
  const detailsOpen = !!detailsMatch;
  const navigate = useNavigate();

  const toggleDetails = useCallback(() => {
    if (detailsOpen) {
      void navigate({
        to: "/convo/$convoId",
        params: { convoId },
      });
    } else {
      void navigate({
        to: "/convo/$convoId/details",
        params: { convoId },
      });
    }
  }, [detailsOpen, navigate, convoId]);

  return { detailsOpen, toggleDetails };
};
