import { useNavigate } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { generatePrivateKey } from "viem/accounts";
import { db } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("new-convo");

export const useCreateConvo = () => {
  const navigate = useNavigate();
  const startedRef = useRef(false);

  return useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // check for existing creating/error convo (dedup)
    const existing = await db.convos
      .filter((c) => c.status === "creating" || c.status === "error")
      .first();

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
      await db.convos.add({
        id,
        privateKey: generatePrivateKey(),
        name: "New Convo",
        status: "creating",
        lastUpdatedAtNs: BigInt(Date.now()) * 1_000_000n,
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
  }, [navigate]);
};
