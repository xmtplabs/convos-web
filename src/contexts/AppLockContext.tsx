import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useAppLock, type AppLockState } from "@/hooks/useAppLock";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

export type AppLockContextValue = {
  lockState: AppLockState;
  acquireLock: (force?: boolean) => boolean;
};

const AppLockContext = createContext<AppLockContextValue>({
  lockState: "available",
  acquireLock: () => false,
});

export const AppLockProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  log.trace("render");
  const { lockState, acquireLock } = useAppLock();
  log.debug("lockState", { lockState });

  // acquire the lock when the app mounts
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      log.trace("acquiring");
      const acquired = acquireLock();
      log.info("acquired", { state: acquired ? "acquired" : lockState });
    }
  }, [acquireLock, lockState]);

  const ctxValue = useMemo(
    () => ({ lockState, acquireLock }),
    [lockState, acquireLock],
  );

  return (
    <AppLockContext.Provider value={ctxValue}>
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLockContext = () => useContext(AppLockContext);
