import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Group,
  isGroupUpdated,
  PermissionPolicy,
  PermissionUpdateType,
  type AsyncStreamProxy,
  type BuiltInContentTypes,
  type Conversation,
  type DecodedMessage,
  type GroupMember,
} from "@xmtp/browser-sdk";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { db, type Convo, type Profile } from "@/db";
import { useAppData } from "@/hooks/useAppData";
import { useConvoGlobalSettings } from "@/hooks/useConvoGlobalSettings";
import { useInboxId } from "@/hooks/useInboxId";
import { usePermissions, type ConvoPermissions } from "@/hooks/usePermissions";
import { useXmtp } from "@/hooks/useXmtp";
import {
  removeGroupImage,
  shareProfileToGroup,
  updateGroupImage,
  type AppData,
  type MemberProfile,
} from "@/utils/appData";
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

export type ResolvedConvo = Convo &
  Required<
    Pick<
      Convo,
      "inviteIncludesInfo" | "muted" | "blurImages" | "quickReactionEmoji"
    >
  >;

export type ConvoContextValue = {
  convo: ResolvedConvo;
  // internal — use action functions instead of accessing directly
  conversation: Conversation<BuiltInContentTypes> | null;
  appData: AppData | null;
  memberProfiles: Map<string, MemberProfile>;
  members: GroupMember[];
  messages: DecodedMessage<BuiltInContentTypes>[];

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
  detailsOpen: boolean;
  toggleDetails: () => void;

  // actions
  removeMember: (memberInboxId: string) => Promise<void>;
  updateImage: (imageData: Uint8Array<ArrayBuffer>) => Promise<void>;
  removeImage: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  shareProfile: (profile: Profile, inboxId: string) => Promise<void>;
  toggleFaved: () => void;
  toggleUnread: () => void;
  setInviteIncludesInfo: (val: boolean) => void;
  toggleMuted: () => void;
  toggleBlurImages: () => void;
  setQuickReactionEmoji: (emoji: string) => void;
};

export const ConvoContext = createContext<ConvoContextValue | null>(null);

export const ConvoProvider: React.FC<{
  convo: Convo;
  conversation: Conversation<BuiltInContentTypes> | null;
  children: React.ReactNode;
}> = ({ convo, conversation, children }) => {
  const [defaults] = useConvoGlobalSettings();
  const { client } = useXmtp();
  const inboxId = useInboxId();
  const { appData, memberProfiles, refreshAppData } = useAppData(
    conversation,
    convo.id,
  );
  const [messages, setMessages] = useState<
    DecodedMessage<BuiltInContentTypes>[]
  >([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reply, setReply] = useState<ReplyState | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const detailsOpen = location.pathname.startsWith(
    `/convo/${convo.id}/details`,
  );
  const toggleDetails = useCallback(() => {
    if (detailsOpen) {
      void navigate({
        to: "/convo/$convoId",
        params: { convoId: convo.id },
      });
    } else {
      void navigate({
        to: "/convo/$convoId/details",
        params: { convoId: convo.id },
      });
    }
  }, [detailsOpen, navigate, convo.id]);
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
    if (!pendingExplode || !conversation) return;
    const expiresAt = pendingExplode.getDate();
    log.info("confirmExplode", {
      convoId: convo.id,
      expiresAt: expiresAt.toISOString(),
    });
    setPendingExplode(null);
    setExploding(true);
    setExplodeError(null);
    setExplodeTimer(
      conversation,
      convo.id,
      expiresAt,
      inboxId,
      client?.installationId,
    )
      .catch((err: unknown) => {
        log.error("explode failed", err);
        setExplodeError(
          err instanceof Error ? err.message : "Failed to explode convo",
        );
      })
      .finally(() => {
        setExploding(false);
      });
  }, [pendingExplode, conversation, convo.id, inboxId, client?.installationId]);

  const cancelExplode = useCallback(() => {
    setPendingExplode(null);
  }, []);

  const removeMember = useCallback(
    async (memberInboxId: string) => {
      if (!(conversation instanceof Group)) return;
      await conversation.removeMembers([memberInboxId]);
    },
    [conversation],
  );

  const updateImage = useCallback(
    async (imageData: Uint8Array<ArrayBuffer>) => {
      if (!(conversation instanceof Group)) return;
      await updateGroupImage(conversation, imageData);
    },
    [conversation],
  );

  const removeImage = useCallback(async () => {
    if (!(conversation instanceof Group)) return;
    await removeGroupImage(conversation);
  }, [conversation]);

  const updateName = useCallback(
    async (name: string) => {
      if (!(conversation instanceof Group)) return;
      await conversation.updateName(name);
      await updateConvo(convoRef.current.id, { name: name || undefined });
    },
    [conversation],
  );

  const updateDescription = useCallback(
    async (description: string) => {
      if (!(conversation instanceof Group)) return;
      await conversation.updateDescription(description);
      await updateConvo(convoRef.current.id, {
        description: description || undefined,
      });
    },
    [conversation],
  );

  const lock = useCallback(async () => {
    if (!(conversation instanceof Group)) return;
    await conversation.updatePermission(
      PermissionUpdateType.AddMember,
      PermissionPolicy.Deny,
    );
    await updateConvo(convoRef.current.id, { locked: true });
  }, [conversation]);

  const unlock = useCallback(async () => {
    if (!(conversation instanceof Group)) return;
    await conversation.updatePermission(
      PermissionUpdateType.AddMember,
      PermissionPolicy.Allow,
    );
    await updateConvo(convoRef.current.id, { locked: false });
  }, [conversation]);

  const shareProfile = useCallback(
    async (profile: Profile, profileInboxId: string) => {
      if (!(conversation instanceof Group)) return;
      await shareProfileToGroup(conversation, profile, profileInboxId);
    },
    [conversation],
  );

  const toggleFaved = useCallback(() => {
    const current = convoRef.current;
    void updateConvo(current.id, { faved: !current.faved });
  }, []);

  const toggleUnread = useCallback(() => {
    const current = convoRef.current;
    void updateConvo(current.id, { unread: !current.unread });
  }, []);

  const setInviteIncludesInfo = useCallback((val: boolean) => {
    void updateConvo(convoRef.current.id, { inviteIncludesInfo: val });
  }, []);

  const toggleMuted = useCallback(() => {
    const current = convoRef.current;
    void updateConvo(current.id, { muted: !current.muted });
  }, []);

  const toggleBlurImages = useCallback(() => {
    const current = convoRef.current;
    void updateConvo(current.id, { blurImages: !current.blurImages });
  }, []);

  const setQuickReactionEmoji = useCallback((emoji: string) => {
    void updateConvo(convoRef.current.id, { quickReactionEmoji: emoji });
  }, []);

  const refresh = useCallback(async () => {
    if (!conversation) return;
    if (conversation.id !== convoRef.current.xmtpId) return;
    log.trace("refresh", { convoId: convoRef.current.id });
    // capture reference to convo so it stays in sync with conversation
    const current = convoRef.current;

    const isActive = await conversation.isActive();
    if (!isActive) {
      log.debug("refresh: conversation not active");
      return;
    }

    // load cached messages immediately, then sync for new ones
    const cached = await conversation.messages();
    setMessages(cached);
    setMembers(await conversation.members());

    await conversation.sync();

    const msgs = await conversation.messages();
    setMessages(msgs);
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
    setMessages([]);
    setMembers([]);

    if (!conversation) return;
    // skip stale conversation from previous convo
    if (conversation.id !== convoRef.current.xmtpId) return;

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

      // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
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

  const resolvedConvo = useMemo<ResolvedConvo>(
    () => ({
      ...convo,
      inviteIncludesInfo:
        convo.inviteIncludesInfo ?? defaults.inviteIncludesInfo,
      muted: convo.muted ?? defaults.muted,
      blurImages: convo.blurImages ?? defaults.blurImages,
      quickReactionEmoji:
        convo.quickReactionEmoji ?? defaults.quickReactionEmoji,
    }),
    [convo, defaults],
  );

  const ctxValue = useMemo(
    () => ({
      convo: resolvedConvo,
      conversation,
      appData,
      memberProfiles,
      members,
      messages,
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
      detailsOpen,
      toggleDetails,
      removeMember,
      updateImage,
      removeImage,
      updateName,
      updateDescription,
      lock,
      unlock,
      shareProfile,
      toggleFaved,
      toggleUnread,
      setInviteIncludesInfo,
      toggleMuted,
      toggleBlurImages,
      setQuickReactionEmoji,
    }),
    [
      resolvedConvo,
      conversation,
      appData,
      memberProfiles,
      members,
      messages,
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
      detailsOpen,
      toggleDetails,
      removeMember,
      updateImage,
      removeImage,
      updateName,
      updateDescription,
      lock,
      unlock,
      shareProfile,
      toggleFaved,
      toggleUnread,
      setInviteIncludesInfo,
      toggleMuted,
      toggleBlurImages,
      setQuickReactionEmoji,
    ],
  );

  return (
    <ConvoContext.Provider value={ctxValue}>{children}</ConvoContext.Provider>
  );
};
