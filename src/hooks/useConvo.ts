import { useCallback, useContext } from "react";
import { ConvoContext } from "@/contexts/ConvoContext";
import { createLogger } from "@/utils/log";

const log = createLogger("sync");

export const useConvo = () => {
  const context = useContext(ConvoContext);
  if (!context) {
    throw new Error("useConvo must be used within a ConvoProvider");
  }

  const {
    appData,
    conversation,
    convo,
    members,
    memberProfiles,
    permissions,
    exploding,
    explodeError,
    clearExplodeError,
    pendingExplode,
    explode,
    confirmExplode,
    cancelExplode,
    setSyncing,
    refresh,
    detailsOpen,
    toggleDetails,
  } = context;

  const sync = useCallback(async () => {
    log.info("sync start");
    setSyncing(true);
    try {
      await refresh();
      log.info("sync complete");
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, refresh]);

  return {
    appData,
    conversation,
    convo,
    members,
    memberProfiles,
    permissions,
    exploding,
    explodeError,
    clearExplodeError,
    pendingExplode,
    explode,
    confirmExplode,
    cancelExplode,
    detailsOpen,
    toggleDetails,
    sync,
  };
};
