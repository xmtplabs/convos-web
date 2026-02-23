import { createContext, useContext, useEffect, useRef } from "react";
import { useAppLock, type AppLockState } from "@/hooks/useAppLock";

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
  const { lockState, acquireLock } = useAppLock();

  // Acquire the lock when the app mounts
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      acquireLock();
    }
  }, [acquireLock]);

  return (
    <AppLockContext.Provider value={{ lockState, acquireLock }}>
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLockContext = () => useContext(AppLockContext);
