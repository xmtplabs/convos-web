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
    log.trace("sync");
    if (!conversation) return [];
    const msgs = await conversation.messages();
    log.trace("synced", { count: msgs.length });
    setMessages(msgs);
    return msgs;
  }, [conversation]);

  const startStream = useCallback(
    async (callback: (msg: DecodedMessage<BuiltInContentTypes>) => void) => {
      log.trace("startStream");
      if (!conversation) return;
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
    log.trace("stopStream");
    if (!streamRef.current) return;
    await streamRef.current.end();
    streamRef.current = null;
  }, []);

  // clear messages and stop stream when conversation changes
  useEffect(() => {
    const changed = conversationRef.current?.id !== conversation?.id;
    conversationRef.current = conversation;
    if (!conversation || changed) {
      log.trace("conversation changed, clearing messages and stopping stream");
      setMessages([]);
      void stopStream();
    }
  }, [conversation, stopStream]);

  return { messages, sync, startStream, stopStream };
};
