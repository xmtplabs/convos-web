import { useCallback } from "react";
import { db } from "@/db";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("use-convo-db");

export const useConvoDb = (convoId: string) => {
  const toggleFaved = useCallback(() => {
    log.trace("toggleFaved", { convoId });
    void db.convos.get(convoId).then((c) => {
      if (c) void updateConvo(convoId, { faved: !c.faved });
    });
  }, [convoId]);

  const toggleUnread = useCallback(() => {
    log.trace("toggleUnread", { convoId });
    void db.convos.get(convoId).then((c) => {
      if (c) void updateConvo(convoId, { unread: !c.unread });
    });
  }, [convoId]);

  const toggleMuted = useCallback(() => {
    log.trace("toggleMuted", { convoId });
    void db.convos.get(convoId).then((c) => {
      if (c) void updateConvo(convoId, { muted: !c.muted });
    });
  }, [convoId]);

  const toggleBlurImages = useCallback(() => {
    log.trace("toggleBlurImages", { convoId });
    void db.convos.get(convoId).then((c) => {
      if (c) void updateConvo(convoId, { blurImages: !c.blurImages });
    });
  }, [convoId]);

  const setInviteIncludesInfo = useCallback(
    (val: boolean) => {
      log.trace("setInviteIncludesInfo", { convoId, val });
      void updateConvo(convoId, { inviteIncludesInfo: val });
    },
    [convoId],
  );

  const setQuickReactionEmoji = useCallback(
    (emoji: string) => {
      log.trace("setQuickReactionEmoji", { convoId, emoji });
      void updateConvo(convoId, { quickReactionEmoji: emoji });
    },
    [convoId],
  );

  const setLocked = useCallback(
    (val: boolean) => {
      log.trace("setLocked", { convoId, val });
      void updateConvo(convoId, { locked: val });
    },
    [convoId],
  );

  return {
    toggleFaved,
    toggleUnread,
    toggleMuted,
    toggleBlurImages,
    setInviteIncludesInfo,
    setQuickReactionEmoji,
    setLocked,
  };
};
