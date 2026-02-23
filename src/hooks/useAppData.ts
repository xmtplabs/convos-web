import { Group, type Conversation } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decodeAppData,
  type AppData,
  type MemberProfile,
} from "@/utils/appData";
import { syncAvatars } from "@/utils/avatars";

export const useAppData = (conversation: Conversation, convoId: string) => {
  const [appData, setAppData] = useState<AppData | null>(null);

  const refreshAppData = useCallback(() => {
    if (!(conversation instanceof Group)) {
      return;
    }
    const raw = conversation.appData;
    if (!raw) {
      setAppData(null);
      return;
    }
    decodeAppData(raw)
      .then((decoded) => {
        setAppData(decoded);
      })
      .catch(() => {
        setAppData(null);
      });
  }, [conversation]);

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
