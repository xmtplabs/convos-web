import {
  encodeText,
  type Reaction,
  type RemoteAttachment,
} from "@xmtp/browser-sdk";
import { useCallback, useContext } from "react";
import { ConvoContext } from "@/contexts/ConvoContext";
import { createLogger } from "@/utils/log";

const log = createLogger("messaging");

export const useSendMessage = () => {
  const context = useContext(ConvoContext);
  if (!context) {
    throw new Error("useConvo must be used within a ConvoProvider");
  }

  const { conversation, setSending, reply, setReply, sending } = context;

  const sendText = useCallback(
    async (text: string) => {
      log.trace("sendText");
      setSending(true);
      try {
        await conversation.sendText(text);
        log.info("text sent");
      } finally {
        setSending(false);
      }
    },
    [conversation, setSending],
  );

  const sendTextReply = useCallback(
    async (messageId: string, text: string) => {
      setSending(true);
      try {
        await conversation.sendReply({
          reference: messageId,
          content: await encodeText(text),
        });
        setReply(null);
      } finally {
        setSending(false);
      }
    },
    [conversation, setSending, setReply],
  );

  const sendRemoteAttachment = useCallback(
    async (remoteAttachment: RemoteAttachment) => {
      log.trace("sendRemoteAttachment", { url: remoteAttachment.url });
      setSending(true);
      try {
        await conversation.sendRemoteAttachment(remoteAttachment);
        log.info("attachment sent");
      } finally {
        setSending(false);
      }
    },
    [conversation, setSending],
  );

  const sendReaction = useCallback(
    async (reaction: Reaction) => {
      setSending(true);
      try {
        await conversation.sendReaction(reaction);
      } finally {
        setSending(false);
      }
    },
    [conversation, setSending],
  );

  return {
    reply,
    setReply,
    loading: sending,
    sendText,
    sendTextReply,
    sendRemoteAttachment,
    sendReaction,
  };
};
