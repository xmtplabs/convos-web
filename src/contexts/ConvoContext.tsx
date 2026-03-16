import {
  ConsentState,
  Group,
  PermissionPolicy,
  isGroupUpdated,
  type AsyncStreamProxy,
  type BuiltInContentTypes,
  type Client,
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
import type { XmtpLockHandle } from "@/contexts/XmtpLockContext";
import { db, type Convo, type Profile } from "@/db";
import { setActiveConvoId } from "@/hooks/useActiveConvo";
import { useAppData } from "@/hooks/useAppData";
import { useConvoActions } from "@/hooks/useConvoActions";
import { useConvoExplode } from "@/hooks/useConvoExplode";
import { useConvoGlobalSettings } from "@/hooks/useConvoGlobalSettings";
import { useMessages } from "@/hooks/useMessages";
import { usePermissions, type ConvoPermissions } from "@/hooks/usePermissions";
import { useXmtpLock } from "@/hooks/useXmtpLock";
import {
  decodeAppData,
  initGroupAppData,
  type AppData,
  type MemberProfile,
} from "@/utils/appData";
import { updateConvo } from "@/utils/convos";
import { isExplodeSettings } from "@/utils/explode";
import { processDmInvite, processExistingDms } from "@/utils/invite";
import { createLogger } from "@/utils/log";
import { registerConvo } from "@/utils/notifications";
import { getContentString } from "@/utils/xmtp";

const log = createLogger("convo-provider");

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
  conversation: Conversation<BuiltInContentTypes> | null;
  client: Client | null;
  ready: boolean;
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
  pendingExplode: {
    getDate: () => Date;
    immediate: boolean;
  } | null;
  explode: (getExpiresAt: () => Date, immediate?: boolean) => void;
  confirmExplode: () => void;
  cancelExplode: () => void;
  refresh: () => Promise<void>;
  retry: () => void;

  // actions
  removeMember: (memberInboxId: string) => Promise<void>;
  updateImage: (imageData: Uint8Array<ArrayBuffer>) => Promise<void>;
  removeImage: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  shareProfile: (profile: Profile, inboxId: string) => Promise<void>;
};

export const ConvoContext = createContext<ConvoContextValue | null>(null);

// -- setup helpers (pure async, not hooks) --

async function setupCreatingConvo(
  client: Client,
  convo: Convo,
  cancelled: { current: boolean },
): Promise<Conversation<BuiltInContentTypes> | null> {
  log.info("setup: creating group", { convoId: convo.id });
  const group = await client.conversations.createGroup([], {
    groupName: convo.name || "New Convo",
  });
  if (cancelled.current) return null;

  const tag = await initGroupAppData(group);
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (cancelled.current) return null;

  await db.convos.update(convo.id, {
    xmtpId: group.id,
    tag,
    status: "ready",
    lastUpdatedAtNs: group.createdAtNs,
  });

  await client.conversations.sync();
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (cancelled.current) return null;

  const conversation = await client.conversations.getConversationById(group.id);
  if (!conversation) {
    log.warn("setup: conversation not found after create");
    return null;
  }

  // register push notifications (fire-and-forget)
  if (client.installationId) {
    registerConvo(client.installationId, conversation.topic).catch(
      (err: unknown) => {
        log.warn("push registration failed", err);
      },
    );
  }

  // start DM invite stream for join requests
  void processExistingDms(client, tag, group);

  return conversation;
}

async function setupPendingConvo(
  client: Client,
  convo: Convo,
  cancelled: { current: boolean },
  onConversation: (conv: Conversation<BuiltInContentTypes>) => void,
  groupStreamRef: React.RefObject<AsyncStreamProxy<Group> | null>,
): Promise<Conversation<BuiltInContentTypes> | null> {
  log.info("setup: pending convo", { convoId: convo.id });
  await client.conversations.sync();
  if (cancelled.current) return null;

  const resolveIfMatch = async (group: Group): Promise<boolean> => {
    await group.sync();
    if (!group.appData) return false;
    try {
      const appData = await decodeAppData(group.appData);
      if (appData.tag !== convo.tag) return false;
    } catch {
      return false;
    }
    log.info("setup: pending convo matched group", {
      groupId: group.id,
    });
    const { status, slug, creatorInboxId, ...rest } = convo;
    await db.convos.put({ ...rest, xmtpId: group.id });

    await client.conversations.sync();
    const conversation = await client.conversations.getConversationById(
      group.id,
    );
    if (!conversation) return false;

    // register push notifications
    if (client.installationId) {
      registerConvo(client.installationId, conversation.topic).catch(
        (err: unknown) => {
          log.warn("push registration failed", err);
        },
      );
    }

    onConversation(conversation);
    return true;
  };

  // start stream first so no welcome messages are missed
  const stream = await client.conversations.streamGroups({
    onValue(group) {
      void resolveIfMatch(group).then((matched) => {
        if (matched && groupStreamRef.current) {
          void groupStreamRef.current.end();
          groupStreamRef.current = null;
        }
      });
    },
  });
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (cancelled.current) {
    void stream.end();
    return null;
  }
  groupStreamRef.current = stream;

  // check existing groups
  const consentStates = [ConsentState.Unknown, ConsentState.Allowed];
  const groups = await client.conversations.listGroups({
    consentStates,
  });
  for (const group of groups) {
    if (await resolveIfMatch(group)) {
      void stream.end();
      groupStreamRef.current = null;
      return null; // conversation set via onConversation callback
    }
  }

  // no match yet — streaming continues
  return null;
}

async function setupReadyConvo(
  client: Client,
  convo: Convo,
  cancelled: { current: boolean },
  dmStreamRef: React.RefObject<AsyncStreamProxy<
    DecodedMessage<BuiltInContentTypes>
  > | null>,
): Promise<Conversation<BuiltInContentTypes> | null> {
  log.trace("setup: ready convo", {
    convoId: convo.id,
    xmtpId: convo.xmtpId,
  });

  const xmtpId = convo.xmtpId;
  if (!xmtpId) {
    log.warn("setup: ready convo missing xmtpId");
    return null;
  }

  // try cached conversation first
  let conversation = await client.conversations.getConversationById(xmtpId);
  if (cancelled.current) return null;

  // if not found locally, sync and retry
  if (!conversation) {
    log.trace("setup: conversation not cached, syncing");
    await client.conversations.sync();
    // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cancelled.current) return null;
    conversation = await client.conversations.getConversationById(xmtpId);
    // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cancelled.current) return null;
  }

  if (!conversation) {
    log.warn("setup: conversation not found", {
      xmtpId: convo.xmtpId,
    });
    return null;
  }

  log.info("setup: ready", {
    convoId: convo.id,
    xmtpId: convo.xmtpId,
  });

  // register push notifications
  if (client.installationId) {
    registerConvo(client.installationId, conversation.topic).catch(
      (err: unknown) => {
        log.warn("push registration failed", err);
      },
    );
  }

  // start DM invite stream for creator convos
  if (convo.tag && conversation instanceof Group) {
    const tag = convo.tag;
    const group = conversation;
    void processExistingDms(client, tag, group).then(async () => {
      // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled.current) return;
      const stream = await client.conversations.streamAllDmMessages({
        disableSync: true,
        onValue(value) {
          void processDmInvite(value, tag, group);
        },
      });
      // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled.current) {
        void stream.end();
      } else {
        dmStreamRef.current = stream;
      }
    });
  }

  return conversation;
}

// -- ConvoProvider --

export const ConvoProvider: React.FC<{
  convo: Convo;
  children: React.ReactNode;
}> = ({ convo, children }) => {
  const { acquireClient } = useXmtpLock();
  const [defaults] = useConvoGlobalSettings();
  const [conversation, setConversation] =
    useState<Conversation<BuiltInContentTypes> | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reply, setReply] = useState<ReplyState | null>(null);

  const convoRef = useRef(convo);
  convoRef.current = convo;
  const convoIdRef = useRef<string | null>(null);
  const handleRef = useRef<XmtpLockHandle | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const groupStreamRef = useRef<AsyncStreamProxy<Group> | null>(null);
  const dmStreamRef = useRef<AsyncStreamProxy<
    DecodedMessage<BuiltInContentTypes>
  > | null>(null);

  // extracted hooks
  const {
    messages,
    sync: syncMessages,
    startStream,
    stopStream,
  } = useMessages(conversation);
  const actions = useConvoActions(convo.id, conversation);
  const explodeState = useConvoExplode(convo.id, conversation, client);
  const { appData, memberProfiles, refreshAppData } = useAppData(
    conversation,
    convo.id,
  );
  const { permissions, refreshPermissions } = usePermissions(
    conversation,
    client,
  );

  // -- lifecycle effect --
  useEffect(() => {
    // dedup guard
    if (convo.id === convoIdRef.current) return;
    convoIdRef.current = convo.id;

    setPhase("loading");
    setConversation(null);
    setClient(null);
    setMembers([]);

    const cancelled = { current: false };

    const setup = async () => {
      log.trace("lifecycle: acquiring client", {
        convoId: convo.id,
      });
      const handle = await acquireClient(convo.privateKey, () => {
        // onEvicted
        log.info("lifecycle: evicted", {
          convoId: convo.id,
        });
        setConversation(null);
        setClient(null);
        // trigger reconnect after eviction ends
        convoIdRef.current = null;
        setReconnectKey((k) => k + 1);
      });
      if (cancelled.current) {
        handle.release();
        return;
      }
      handleRef.current = handle;
      setClient(handle.client);

      let conv: Conversation<BuiltInContentTypes> | null = null;

      const status = convo.status;
      if (status === "creating" || status === "error") {
        try {
          conv = await setupCreatingConvo(handle.client, convo, cancelled);
        } catch (err) {
          log.error("lifecycle: create failed", err);
          await db.convos.update(convo.id, {
            status: "error",
          });
          setPhase("error");
          return;
        }
      } else if (status === "pending") {
        conv = await setupPendingConvo(
          handle.client,
          convo,
          cancelled,
          (c) => {
            if (!cancelled.current) {
              setConversation(c);
              setActiveConvoId(c.id);
              setPhase("ready");
            }
          },
          groupStreamRef,
        );
      } else {
        // ready or no status (legacy)
        conv = await setupReadyConvo(
          handle.client,
          convo,
          cancelled,
          dmStreamRef,
        );
      }

      // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled.current) return;

      if (conv) {
        setConversation(conv);
        setActiveConvoId(conv.id);
        setPhase("ready");
      }
    };

    void setup();

    return () => {
      cancelled.current = true;
      if (groupStreamRef.current) {
        void groupStreamRef.current.end();
        groupStreamRef.current = null;
      }
      if (dmStreamRef.current) {
        void dmStreamRef.current.end();
        dmStreamRef.current = null;
      }
      void stopStream();
      if (handleRef.current) {
        handleRef.current.release();
        handleRef.current = null;
      }
      setActiveConvoId(null);
      convoIdRef.current = null;
    };
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [convo.id, reconnectKey]);

  // -- message stream + refresh --
  const refresh = useCallback(async () => {
    if (!conversation) return;
    if (conversation.id !== convoRef.current.xmtpId) return;
    log.trace("refresh", { convoId: convoRef.current.id });
    const current = convoRef.current;

    const isActive = await conversation.isActive();
    if (!isActive) {
      log.debug("refresh: conversation not active");
      return;
    }

    // load cached messages immediately, then sync
    await syncMessages();
    setMembers(await conversation.members());

    await conversation.sync();
    const msgs = await syncMessages();
    setMembers(await conversation.members());

    // sync metadata to local DB
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
      actions.setLocked(policySet.addMemberPolicy === PermissionPolicy.Deny);
    }
  }, [conversation, syncMessages, refreshAppData, refreshPermissions, actions]);

  // start message stream when conversation becomes available
  useEffect(() => {
    if (!conversation) return;
    if (conversation.id !== convoRef.current.xmtpId) return;

    let cancelled = false;

    const init = async () => {
      await refresh();
      if (cancelled) return;

      await startStream((value) => {
        if (isExplodeSettings(value)) return;
        const current = convoRef.current;
        void updateConvo(current.id, {
          lastMessage: getContentString(value) ?? current.lastMessage,
          lastUpdatedAtNs: value.sentAtNs,
        });
        if (isGroupUpdated(value) && conversation instanceof Group) {
          void refresh();
        }
      });
    };

    void init();

    return () => {
      cancelled = true;
      void stopStream();
    };
  }, [conversation, refresh, startStream, stopStream]);

  // mark as read on mount
  useEffect(() => {
    void updateConvo(convo.id, { unread: false });
  }, [convo.id]);

  // sync locked state from permissions to local DB
  useEffect(() => {
    const current = convoRef.current;
    if (current.locked !== actions.isLocked) {
      void updateConvo(current.id, {
        locked: actions.isLocked,
      });
    }
  }, [actions.isLocked]);

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

  // -- retry --
  const retry = useCallback(() => {
    log.info("retry", { convoId: convo.id });
    void db.convos.update(convo.id, { status: "creating" });
    convoIdRef.current = null;
    setPhase("loading");
  }, [convo.id]);

  // -- resolved convo --
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
      client,
      ready: phase === "ready" && conversation != null,
      appData,
      memberProfiles,
      members,
      messages,
      permissions,
      isLocked: actions.isLocked,
      ...explodeState,
      sending,
      setSending,
      syncing,
      setSyncing,
      reply,
      setReply,
      refresh,
      retry,
      removeMember: actions.removeMember,
      updateImage: actions.updateImage,
      removeImage: actions.removeImage,
      updateName: actions.updateName,
      updateDescription: actions.updateDescription,
      lock: actions.lock,
      unlock: actions.unlock,
      shareProfile: actions.shareProfile,
    }),
    [
      resolvedConvo,
      conversation,
      client,
      phase,
      appData,
      memberProfiles,
      members,
      messages,
      permissions,
      actions,
      explodeState,
      sending,
      syncing,
      reply,
      refresh,
      retry,
    ],
  );

  return (
    <ConvoContext.Provider value={ctxValue}>{children}</ConvoContext.Provider>
  );
};
