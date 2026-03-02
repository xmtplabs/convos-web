import {
  Group,
  isGroupUpdated,
  PermissionPolicy,
  type AsyncStreamProxy,
  type BuiltInContentTypes,
  type Conversation,
  type DecodedMessage,
  type GroupMember,
} from "@xmtp/browser-sdk";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { db, type Convo } from "@/db";
import { useAppData } from "@/hooks/useAppData";
import { useInboxId } from "@/hooks/useInboxId";
import { usePermissions, type ConvoPermissions } from "@/hooks/usePermissions";
import type { AppData, MemberProfile } from "@/utils/appData";
import { updateConvo } from "@/utils/convos";
import { isExplodeSettings, setExplodeTimer } from "@/utils/explode";
import { createLogger } from "@/utils/log";
import { getContentString } from "@/utils/xmtp";

const log = createLogger("sync");

export type ReplyState = {
  messageId: string;
  senderInboxId: string;
  content: string;
};

export type ConvoContextValue = {
  convo: Convo;
  conversation: Conversation<BuiltInContentTypes>;
  appData: AppData | null;
  memberProfiles: Map<string, MemberProfile>;
  members: GroupMember[];
  messages: DecodedMessage<BuiltInContentTypes>[];
  messagesLoading: boolean;
  sending: boolean;
  setSending: React.Dispatch<React.SetStateAction<boolean>>;
  syncing: boolean;
  setSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  reply: ReplyState | null;
  setReply: (reply: ReplyState | null) => void;
  permissions: ConvoPermissions | null;
  isLocked: boolean;
  exploding: boolean;
  explodeError: string | null;
  clearExplodeError: () => void;
  pendingExplode: { getDate: () => Date; immediate: boolean } | null;
  explode: (getExpiresAt: () => Date, immediate?: boolean) => void;
  confirmExplode: () => void;
  cancelExplode: () => void;
  refresh: () => Promise<void>;
};

export const ConvoContext = createContext<ConvoContextValue | null>(null);

export const ConvoProvider: React.FC<{
  convo: Convo;
  conversation: Conversation<BuiltInContentTypes>;
  children: React.ReactNode;
}> = ({ convo, conversation, children }) => {
  const inboxId = useInboxId();
  const { appData, memberProfiles, refreshAppData } = useAppData(
    conversation,
    convo.id,
  );
  const [messages, setMessages] = useState<
    DecodedMessage<BuiltInContentTypes>[]
  >([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reply, setReply] = useState<ReplyState | null>(null);
  const streamRef =
    useRef<AsyncStreamProxy<DecodedMessage<BuiltInContentTypes>>>(null);
  const convoRef = useRef(convo);
  convoRef.current = convo;

  const { permissions, refreshPermissions } = usePermissions(conversation);
  const [isLocked, setIsLocked] = useState(false);
  const [exploding, setExploding] = useState(false);
  const [explodeError, setExplodeError] = useState<string | null>(null);
  const [pendingExplode, setPendingExplode] = useState<{
    getDate: () => Date;
    immediate: boolean;
  } | null>(null);
  const clearExplodeError = useCallback(() => {
    setExplodeError(null);
  }, []);

  const explode = useCallback(
    (getExpiresAt: () => Date, immediate?: boolean) => {
      setPendingExplode({
        getDate: getExpiresAt,
        immediate: immediate ?? false,
      });
    },
    [],
  );

  const confirmExplode = useCallback(() => {
    if (!pendingExplode) return;
    const expiresAt = pendingExplode.getDate();
    log.info("confirmExplode", {
      convoId: convo.id,
      expiresAt: expiresAt.toISOString(),
    });
    setPendingExplode(null);
    setExploding(true);
    setExplodeError(null);
    setExplodeTimer(conversation, convo.id, expiresAt, inboxId)
      .catch((err: unknown) => {
        log.error("explode failed", err);
        setExplodeError(
          err instanceof Error ? err.message : "Failed to explode convo",
        );
      })
      .finally(() => {
        setExploding(false);
      });
  }, [pendingExplode, conversation, convo.id, inboxId]);

  const cancelExplode = useCallback(() => {
    setPendingExplode(null);
  }, []);

  const refresh = useCallback(async () => {
    log.trace("refresh", { convoId: convoRef.current.id });
    // capture reference to convo so it stays in sync with conversation
    const current = convoRef.current;

    const isActive = await conversation.isActive();
    if (!isActive) {
      log.debug("refresh: conversation not active");
      return;
    }

    await conversation.sync();

    const msgs = await conversation.messages();
    setMessages(msgs);
    setMessagesLoading(false);
    setMembers(await conversation.members());

    // sync conversation metadata and last message to local DB
    const updates: Partial<Convo> = {};
    if (conversation instanceof Group) {
      const name = conversation.name;
      const description = conversation.description;
      const imageUrl = conversation.imageUrl;
      if (name && name !== current.name) {
        updates.name = name;
      }
      if (description !== current.description) {
        updates.description = description || undefined;
      }
      if (imageUrl !== current.imageUrl) {
        updates.imageUrl = imageUrl || undefined;
      }
    }
    const lastMsg = msgs.at(-1);
    if (lastMsg && lastMsg.sentAtNs !== current.lastUpdatedAtNs) {
      updates.lastMessage = getContentString(lastMsg) ?? current.lastMessage;
      updates.lastUpdatedAtNs = lastMsg.sentAtNs;
    }
    if (Object.keys(updates).length > 0) {
      await updateConvo(current.id, updates);
    }

    refreshAppData();
    const policySet = await refreshPermissions();
    if (policySet) {
      setIsLocked(policySet.addMemberPolicy === PermissionPolicy.Deny);
    }
  }, [conversation, refreshAppData, refreshPermissions]);

  // sync locked state from permissions to local DB
  useEffect(() => {
    const current = convoRef.current;
    if (current.locked !== isLocked) {
      void updateConvo(current.id, { locked: isLocked });
    }
  }, [isLocked]);

  // sync explode state from appData to local DB
  useEffect(() => {
    const current = convoRef.current;
    if (
      appData?.expiresAtUnix != null &&
      Number(appData.expiresAtUnix) !== current.expiresAtUnix
    ) {
      const unix = Number(appData.expiresAtUnix);
      log.info("syncing expiresAt from appData", {
        convoId: current.id,
        unix,
      });
      if (unix <= Math.floor(Date.now() / 1000)) {
        // already expired — delete locally
        log.info("already expired during sync, deleting locally", {
          convoId: current.id,
        });
        void db.avatars.where("convoId").equals(current.id).delete();
        void db.convos.delete(current.id);
      } else {
        void updateConvo(current.id, { expiresAtUnix: unix });
      }
    }
  }, [appData?.expiresAtUnix]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      log.trace("starting message stream");
      await refresh();

      if (cancelled) {
        return;
      }

      const stream = await conversation.stream({
        onValue(value) {
          if (isExplodeSettings(value)) {
            // appData sync (via GroupUpdated) already handles the timer
            // when we're in the convo — no action needed here. in the
            // future, push notifications will use this message to set
            // the timer on convos that aren't currently selected.
            return;
          }
          setMessages((prev) => [...prev, value]);
          const current = convoRef.current;
          void updateConvo(current.id, {
            lastMessage: getContentString(value) ?? current.lastMessage,
            lastUpdatedAtNs: value.sentAtNs,
          });
          if (isGroupUpdated(value) && conversation instanceof Group) {
            void refresh();
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) {
        await stream.end();
        return;
      }

      streamRef.current = stream;
    };

    void init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        void streamRef.current.end();
        streamRef.current = null;
      }
    };
  }, [conversation, refresh]);

  return (
    <ConvoContext.Provider
      value={{
        convo,
        conversation,
        appData,
        memberProfiles,
        members,
        messages,
        messagesLoading,
        permissions,
        isLocked,
        exploding,
        explodeError,
        clearExplodeError,
        pendingExplode,
        explode,
        confirmExplode,
        cancelExplode,
        sending,
        setSending,
        syncing,
        setSyncing,
        reply,
        setReply,
        refresh,
      }}>
      {children}
    </ConvoContext.Provider>
  );
};
