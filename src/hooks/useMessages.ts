import type {
  AsyncStreamProxy,
  BuiltInContentTypes,
  Conversation,
  DecodedMessage,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("use-messages");

export const useMessages = (
  conversation: Conversation<BuiltInContentTypes> | null,
) => {
  const conversationRef = useRef(conversation);
  const streamRef = useRef<AsyncStreamProxy<
    DecodedMessage<BuiltInContentTypes>
  > | null>(null);
  const [messages, setMessages] = useState<
    DecodedMessage<BuiltInContentTypes>[]
  >([]);

  const sync = useCallback(async () => {
    if (!conversation) return [];
    const msgs = await conversation.messages();
    log.trace("synced", { count: msgs.length });
    setMessages(msgs);
    return msgs;
  }, [conversation]);

  const startStream = useCallback(
    async (callback: (msg: DecodedMessage<BuiltInContentTypes>) => void) => {
      if (!conversation) return;
      log.trace("starting stream");
      const stream = await conversation.stream({
        onValue(value) {
          setMessages((prev) => [...prev, value]);
          callback(value);
        },
      });
      streamRef.current = stream;
    },
    [conversation],
  );

  const stopStream = useCallback(async () => {
    if (!streamRef.current) return;
    log.trace("stopping stream");
    await streamRef.current.end();
    streamRef.current = null;
  }, []);

  // clear messages and stop stream when conversation changes
  useEffect(() => {
    const changed = conversationRef.current?.id !== conversation?.id;
    conversationRef.current = conversation;
    if (!conversation || changed) {
      setMessages([]);
      void stopStream();
    }
  }, [conversation, stopStream]);

  return { messages, sync, startStream, stopStream };
};
