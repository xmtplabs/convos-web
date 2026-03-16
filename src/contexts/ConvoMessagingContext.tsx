import {
  encodeText,
  type BuiltInContentTypes,
  type Conversation,
  type DecodedMessage,
  type Reaction,
  type RemoteAttachment,
} from "@xmtp/browser-sdk";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReplyState } from "@/contexts/ConvoContext";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-messaging");

export type ConvoMessagingContextValue = {
  messages: DecodedMessage<BuiltInContentTypes>[];
  sending: boolean;
  reply: ReplyState | null;
  setReply: (reply: ReplyState | null) => void;
  sendText: (text: string) => Promise<void>;
  sendTextReply: (messageId: string, text: string) => Promise<void>;
  sendRemoteAttachment: (remoteAttachment: RemoteAttachment) => Promise<void>;
  sendReaction: (reaction: Reaction) => Promise<void>;
};

const ConvoMessagingContext = createContext<ConvoMessagingContextValue | null>(
  null,
);

export const useConvoMessaging = () => {
  const context = useContext(ConvoMessagingContext);
  if (!context) {
    throw new Error("useConvoMessaging must be used within a ConvoProvider");
  }
  return context;
};

export const ConvoMessagingProvider: React.FC<{
  conversation: Conversation<BuiltInContentTypes> | null;
  messages: DecodedMessage<BuiltInContentTypes>[];
  children: React.ReactNode;
}> = ({ conversation, messages, children }) => {
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<ReplyState | null>(null);

  const sendText = useCallback(
    async (text: string) => {
      if (!conversation) return;
      log.trace("sending text");
      setSending(true);
      try {
        await conversation.sendText(text);
        log.info("text sent");
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendTextReply = useCallback(
    async (messageId: string, text: string) => {
      if (!conversation) return;
      log.trace("sending text reply");
      setSending(true);
      try {
        await conversation.sendReply({
          reference: messageId,
          content: await encodeText(text),
        });
        log.info("text reply sent");
        setReply(null);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendRemoteAttachment = useCallback(
    async (remoteAttachment: RemoteAttachment) => {
      if (!conversation) return;
      log.trace("sending remote attachment");
      setSending(true);
      try {
        await conversation.sendRemoteAttachment(remoteAttachment);
        log.info("remote attachment sent");
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendReaction = useCallback(
    async (reaction: Reaction) => {
      if (!conversation) return;
      log.trace("sending reaction");
      setSending(true);
      try {
        await conversation.sendReaction(reaction);
        log.info("reaction sent");
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const value = useMemo(
    () => ({
      messages,
      sending,
      reply,
      setReply,
      sendText,
      sendTextReply,
      sendRemoteAttachment,
      sendReaction,
    }),
    [
      messages,
      sending,
      reply,
      sendText,
      sendTextReply,
      sendRemoteAttachment,
      sendReaction,
    ],
  );

  return (
    <ConvoMessagingContext.Provider value={value}>
      {children}
    </ConvoMessagingContext.Provider>
  );
};
