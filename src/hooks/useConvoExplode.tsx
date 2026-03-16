import type {
  Client,
  BuiltInContentTypes,
  Conversation,
} from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import { setExplodeTimer } from "@/utils/explode";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-provider");

export const useConvoExplode = (
  convoId: string,
  conversation: Conversation<BuiltInContentTypes> | null,
  client: Client | null,
) => {
  const inboxId = client?.inboxId ?? "";
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
      convoId,
      expiresAt: expiresAt.toISOString(),
    });
    setPendingExplode(null);
    setExploding(true);
    setExplodeError(null);
    setExplodeTimer(
      conversation,
      convoId,
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
  }, [pendingExplode, conversation, convoId, client?.installationId, inboxId]);

  const cancelExplode = useCallback(() => {
    setPendingExplode(null);
  }, []);

  return useMemo(
    () => ({
      exploding,
      explodeError,
      pendingExplode,
      clearExplodeError,
      explode,
      confirmExplode,
      cancelExplode,
    }),
    [
      exploding,
      explodeError,
      pendingExplode,
      clearExplodeError,
      explode,
      confirmExplode,
      cancelExplode,
    ],
  );
};
