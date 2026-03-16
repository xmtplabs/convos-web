import {
  Group,
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

export const useConvoActions = (
  convoId: string,
  conversation: Conversation<BuiltInContentTypes> | null,
) => {
  const [isLocked, setLocked] = useState(false);

  const removeMember = useCallback(
    async (memberInboxId: string) => {
      if (!(conversation instanceof Group)) return;
      await conversation.removeMembers([memberInboxId]);
    },
    [conversation],
  );

  const updateName = useCallback(
    async (name: string) => {
      if (!(conversation instanceof Group)) return;
      await conversation.updateName(name);
      void updateConvo(convoId, { name });
    },
    [conversation, convoId],
  );

  const updateDescription = useCallback(
    async (description: string) => {
      if (!(conversation instanceof Group)) return;
      await conversation.updateDescription(description);
      void updateConvo(convoId, { description });
    },
    [conversation, convoId],
  );

  const updateImage = useCallback(
    async (imageData: Uint8Array) => {
      if (!(conversation instanceof Group)) return;
      await updateGroupImage(
        conversation,
        imageData as Uint8Array<ArrayBuffer>,
      );
    },
    [conversation],
  );

  const removeImage = useCallback(async () => {
    if (!(conversation instanceof Group)) return;
    await removeGroupImage(conversation);
  }, [conversation]);

  const lock = useCallback(async () => {
    if (!(conversation instanceof Group)) return;
    await conversation.updatePermission(
      PermissionUpdateType.AddMember,
      PermissionPolicy.Deny,
    );
    void updateConvo(convoId, { locked: true });
    setLocked(true);
  }, [conversation, convoId]);

  const unlock = useCallback(async () => {
    if (!(conversation instanceof Group)) return;
    await conversation.updatePermission(
      PermissionUpdateType.AddMember,
      PermissionPolicy.Allow,
    );
    void updateConvo(convoId, { locked: false });
    setLocked(false);
  }, [conversation, convoId]);

  const shareProfile = useCallback(
    async (profile: Profile, inboxId: string) => {
      if (!(conversation instanceof Group)) return;
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
