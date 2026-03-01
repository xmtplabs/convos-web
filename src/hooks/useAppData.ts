import { Group, type Conversation } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decodeAppData,
  type AppData,
  type MemberProfile,
} from "@/utils/appData";
import { syncAvatars } from "@/utils/avatars";
import { createLogger } from "@/utils/log";

const log = createLogger("sync");

type AppDataEntry = { convoId: string; data: AppData };

export const useAppData = (conversation: Conversation, convoId: string) => {
  const [entry, setEntry] = useState<AppDataEntry | null>(null);

  // only expose appData when it belongs to the current convo to ensure
  // that consumers have the correct appData
  const appData = useMemo(
    () => (entry?.convoId === convoId ? entry.data : null),
    [entry, convoId],
  );

  const refreshAppData = useCallback(() => {
    log.trace("refreshAppData", { convoId });
    if (!(conversation instanceof Group)) {
      return;
    }
    if (!conversation.appData) {
      setEntry(null);
      return;
    }
    decodeAppData(conversation.appData)
      .then((decoded) => {
        log.debug("appData decoded", {
          convoId,
          profiles: decoded.profiles.length,
        });
        setEntry({ convoId, data: decoded });
      })
      .catch((err: unknown) => {
        log.error("appData decode failed", err);
        setEntry(null);
      });
  }, [conversation, convoId]);

  const memberProfiles = useMemo(() => {
    const map = new Map<string, MemberProfile>();
    if (appData) {
      for (const p of appData.profiles) {
        map.set(p.inboxId, p);
      }
    }
    return map;
  }, [appData]);

  useEffect(() => {
    if (!appData) {
      return;
    }
    const controller = new AbortController();
    void syncAvatars(convoId, appData, controller.signal);
    return () => {
      controller.abort();
    };
  }, [appData, convoId]);

  return { appData, memberProfiles, refreshAppData };
};
