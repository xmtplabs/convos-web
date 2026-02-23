import {
  Group,
  isGroupUpdated,
  type AsyncStreamProxy,
  type BuiltInContentTypes,
  type Conversation,
  type DecodedMessage,
  type GroupMember,
} from "@xmtp/browser-sdk";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { Convo } from "@/db";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions, type ConvoPermissions } from "@/hooks/usePermissions";
import type { AppData, MemberProfile } from "@/utils/appData";
import { updateConvo } from "@/utils/convos";
import { getContentString } from "@/utils/xmtp";

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
  refresh: () => Promise<void>;
};

export const ConvoContext = createContext<ConvoContextValue | null>(null);

export const ConvoProvider: React.FC<{
  convo: Convo;
  conversation: Conversation<BuiltInContentTypes>;
  children: React.ReactNode;
}> = ({ convo, conversation, children }) => {
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

  const refresh = useCallback(async () => {
    const isActive = await conversation.isActive();
    if (!isActive) return;

    setMessagesLoading(true);
    await conversation.sync();

    const msgs = await conversation.messages();
    setMessages(msgs);
    setMessagesLoading(false);
    setMembers(await conversation.members());

    // Sync conversation metadata and last message to local DB
    const current = convoRef.current;
    const updates: Partial<Convo> = {};
    if (conversation instanceof Group) {
      const name = conversation.name;
      const description = conversation.description;
      const imageUrl = conversation.imageUrl;
      if (name && name !== current.name) updates.name = name;
      if (description !== current.description)
        updates.description = description || undefined;
      if (imageUrl !== current.imageUrl)
        updates.imageUrl = imageUrl || undefined;
    }
    const lastMsg = msgs.at(-1);
    if (lastMsg && lastMsg.sentAtNs !== current.lastUpdatedAtNs) {
      updates.lastMessage = getContentString(lastMsg) ?? current.lastMessage;
      updates.lastUpdatedAtNs = lastMsg.sentAtNs;
    }
    if (Object.keys(updates).length > 0) {
      void updateConvo({ ...current, ...updates });
    }

    refreshAppData();
    void refreshPermissions();
  }, [conversation, refreshAppData, refreshPermissions]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await refresh();

      if (cancelled) return;

      const stream = await conversation.stream({
        onValue(value) {
          setMessages((prev) => [...prev, value]);
          const current = convoRef.current;
          void updateConvo({
            ...current,
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
