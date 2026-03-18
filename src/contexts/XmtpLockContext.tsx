import type { Client } from "@xmtp/browser-sdk";
import { createContext, useCallback, useMemo, useRef } from "react";
import { createLogger } from "@/utils/log";
import { createClient } from "@/utils/xmtp";

const log = createLogger("xmtp-lock");

export type XmtpLockHandle = {
  client: Client;
  release: () => void;
};

export type XmtpLockContextValue = {
  acquireClient: (
    privateKey: `0x${string}`,
    onEvicted?: () => void,
    isCancelled?: () => boolean,
  ) => Promise<XmtpLockHandle | null>;
};

export const XmtpLockContext = createContext<XmtpLockContextValue | null>(null);

type LockState = {
  client: Client;
  onEvicted?: () => void;
  released: boolean;
};

export const XmtpLockProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const lockRef = useRef<LockState | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const acquireClient = useCallback(
    async (
      privateKey: `0x${string}`,
      onEvicted?: () => void,
      isCancelled?: () => boolean,
    ): Promise<XmtpLockHandle | null> => {
      let handle: XmtpLockHandle | null = null;
      queueRef.current = queueRef.current
        .catch(() => {})
        .then(async () => {
          // skip if requester was cancelled (e.g. StrictMode cleanup)
          if (isCancelled?.()) return;

          // evict current holder if present
          if (lockRef.current && !lockRef.current.released) {
            log.info("evicting current lock holder");
            lockRef.current.released = true;
            lockRef.current.onEvicted?.();
            lockRef.current.client.close();
            lockRef.current = null;
          }

          log.info("creating client");
          const client = await createClient(privateKey);

          const state: LockState = { client, onEvicted, released: false };
          lockRef.current = state;

          const release = () => {
            if (state.released) return;
            state.released = true;
            log.info("releasing lock");
            client.close();
            if (lockRef.current === state) {
              lockRef.current = null;
            }
          };

          handle = { client, release };
        });

      await queueRef.current;
      return handle;
    },
    [],
  );

  const ctxValue = useMemo(() => ({ acquireClient }), [acquireClient]);

  return (
    <XmtpLockContext.Provider value={ctxValue}>
      {children}
    </XmtpLockContext.Provider>
  );
};
