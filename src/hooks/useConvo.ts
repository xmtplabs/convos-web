import { useCallback, useContext } from "react";
import { ConvoContext } from "@/contexts/ConvoContext";

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
    setSyncing,
    refresh,
  } = context;

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await refresh();
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
    sync,
  };
};
