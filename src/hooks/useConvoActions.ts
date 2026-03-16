import {
  PermissionPolicy,
  PermissionUpdateType,
  type BuiltInContentTypes,
  type Conversation,
} from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import type { Profile } from "@/db";
import {
  removeGroupImage,
  shareProfileToGroup,
  updateGroupImage,
} from "@/utils/appData";
import { updateConvo } from "@/utils/db";
import { createLogger } from "@/utils/log";
import { isGroup } from "@/utils/xmtp";

const log = createLogger("use-convo-actions");

export const useConvoActions = (
  convoId: string,
  conversation: Conversation<BuiltInContentTypes> | null,
) => {
  const [isLocked, setLocked] = useState(false);

  const removeMember = useCallback(
    async (memberInboxId: string) => {
      log.trace("removeMember", { memberInboxId });
      if (!isGroup(conversation)) {
        return;
      }
      await conversation.removeMembers([memberInboxId]);
    },
    [conversation],
  );

  const updateName = useCallback(
    async (name: string) => {
      log.trace("updateName", { name });
      if (!isGroup(conversation)) {
        return;
      }
      await conversation.updateName(name);
      void updateConvo(convoId, { name });
    },
    [conversation, convoId],
  );

  const updateDescription = useCallback(
    async (description: string) => {
      log.trace("updateDescription", { description });
      if (!isGroup(conversation)) {
        return;
      }
      await conversation.updateDescription(description);
      void updateConvo(convoId, { description });
    },
    [conversation, convoId],
  );

  const updateImage = useCallback(
    async (imageData: Uint8Array) => {
      log.trace("updateImage", { imageData });
      if (!isGroup(conversation)) {
        return;
      }
      await updateGroupImage(
        conversation,
        imageData as Uint8Array<ArrayBuffer>,
      );
    },
    [conversation],
  );

  const removeImage = useCallback(async () => {
    log.trace("removeImage");
    if (!isGroup(conversation)) {
      return;
    }
    await removeGroupImage(conversation);
  }, [conversation]);

  const lock = useCallback(async () => {
    log.trace("lock");
    if (!isGroup(conversation)) {
      return;
    }
    try {
      await conversation.updatePermission(
        PermissionUpdateType.AddMember,
        PermissionPolicy.Deny,
      );
    } catch (error) {
      log.error("lock error", error);
      throw error;
    }
    void updateConvo(convoId, { locked: true });
    setLocked(true);
  }, [conversation, convoId]);

  const unlock = useCallback(async () => {
    log.trace("unlock");
    if (!isGroup(conversation)) {
      return;
    }
    try {
      await conversation.updatePermission(
        PermissionUpdateType.AddMember,
        PermissionPolicy.Allow,
      );
    } catch (error) {
      log.error("unlock error", error);
      throw error;
    }
    void updateConvo(convoId, { locked: false });
    setLocked(false);
  }, [conversation, convoId]);

  const shareProfile = useCallback(
    async (profile: Profile, inboxId: string) => {
      log.trace("shareProfile", { profile, inboxId });
      if (!isGroup(conversation)) {
        return;
      }
      await shareProfileToGroup(conversation, profile, inboxId);
    },
    [conversation],
  );

  return useMemo(
    () => ({
      isLocked,
      setLocked,
      lock,
      unlock,
      removeMember,
      removeImage,
      shareProfile,
      updateDescription,
      updateImage,
      updateName,
    }),
    [
      isLocked,
      lock,
      unlock,
      removeMember,
      removeImage,
      shareProfile,
      updateDescription,
      updateImage,
      updateName,
    ],
  );
};
