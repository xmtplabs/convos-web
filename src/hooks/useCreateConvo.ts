import { useNavigate } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { generatePrivateKey } from "viem/accounts";
import { useConvoGlobalSettings } from "@/hooks/useConvoGlobalSettings";
import { addConvo, findConvoBy } from "@/utils/db";
import { createLogger } from "@/utils/log";

const log = createLogger("use-create-convo");

export const useCreateConvo = () => {
  const navigate = useNavigate();
  const [defaults] = useConvoGlobalSettings();
  const startedRef = useRef(false);

  return useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // check for existing creating/error convo (dedup)
    const existing = await findConvoBy(
      (c) => c.status === "creating" || c.status === "error",
    );

    if (existing) {
      log.info("resuming existing convo", {
        convoId: existing.id,
      });
      startedRef.current = false;
      void navigate({
        to: "/convo/$convoId",
        params: { convoId: existing.id },
      });
      return;
    }

    const id = window.crypto.randomUUID();
    try {
      log.trace("creating convo record", { id });
      await addConvo({
        id,
        privateKey: generatePrivateKey(),
        name: "New Convo",
        status: "creating",
        lastUpdatedAtNs: BigInt(Date.now()) * 1_000_000n,
        inviteIncludesInfo: defaults.inviteIncludesInfo,
        muted: defaults.muted,
        blurImages: defaults.blurImages,
        quickReactionEmoji: defaults.quickReactionEmoji,
      });
    } catch (err) {
      log.error("failed to create convo record", err);
      startedRef.current = false;
      return;
    }

    log.info("created, navigating", { convoId: id });
    startedRef.current = false;
    void navigate({
      to: "/convo/$convoId",
      params: { convoId: id },
    });
  }, [navigate, defaults]);
};
