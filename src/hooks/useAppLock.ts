import { useLocalStorage } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

export const APP_LOCK_ID_KEY = "XMTP_APP_LOCK_ID";
export const APP_LOCK_LAST_ACTIVE_KEY = "XMTP_APP_LOCK_LAST_ACTIVE";
// interval to set the last active time
export const ACTIVE_INTERVAL = 2000;
// time threshold (ms) to consider the lock stale
export const STALE_THRESHOLD = 30000;

/**
 * App lock state
 * - active: the current session has the lock
 * - locked: another session has the lock
 * - available: no active sessions
 */
export type AppLockState = "active" | "locked" | "available";

/**
 * Check if the lock is stale
 * @param lastActive - the last active time
 * @returns true if the lock is stale
 */
const isLockStale = (lastActive: number | null) => {
  return lastActive === null || Date.now() - lastActive > STALE_THRESHOLD;
};

export const useAppLock = (onLockLost?: () => void) => {
  // random UUID to identify the lock
  const lockIdRef = useRef(crypto.randomUUID());
  // flag to track if the lock has been acquired
  const hadLockRef = useRef(false);
  // lock ID stored in local storage
  const [lockId, setLockId] = useLocalStorage<string | null>({
    key: APP_LOCK_ID_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  // last active time stored in local storage
  const [lastActive, setLastActive] = useLocalStorage<number | null>({
    key: APP_LOCK_LAST_ACTIVE_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  // lastActive ref to avoid re-renders
  const lastActiveRef = useRef(lastActive);
  lastActiveRef.current = lastActive;

  const lockState: AppLockState = useMemo(() => {
    let state: AppLockState;
    if (lockId === null) {
      state = "available";
    } else if (lockId === lockIdRef.current) {
      state = "active";
    } else if (isLockStale(lastActive)) {
      state = "available";
    } else {
      state = "locked";
    }
    log.debug("lockState resolved", { state, lockId, lastActive });
    return state;
  }, [lockId, lastActive]);

  /**
   * Acquire the lock
   * @param force - force the lock to be acquired
   * @returns true if the lock was acquired
   */
  const acquireLock = useCallback(
    (force?: boolean) => {
      log.info("acquireLock attempt", { force, currentLockId: lockId });
      // if the lock is not stale and acquired by another session, don't acquire it
      // unless force is true
      if (
        !isLockStale(lastActiveRef.current) &&
        lockId !== null &&
        lockId !== lockIdRef.current &&
        !force
      ) {
        log.debug("acquireLock denied, held by another session");
        return false;
      }
      // acquire the lock
      setLockId(lockIdRef.current);
      setLastActive(Date.now());
      // lock acquired, set the flag to true
      hadLockRef.current = true;
      log.info("acquireLock acquired", { lockId: lockIdRef.current });
      return true;
    },
    [lockId, setLockId, setLastActive],
  );

  const releaseLock = useCallback((): void => {
    log.info("releaseLock");
    hadLockRef.current = false;
    setLockId(null);
    setLastActive(null);
  }, [setLockId, setLastActive]);

  // if the lock is lost, call the onLockLost callback
  // this is helpful for disconnecting the user when the lock is lost
  useEffect(() => {
    if (lockState !== "active" && hadLockRef.current) {
      log.warn("lock lost, invoking onLockLost callback");
      hadLockRef.current = false;
      onLockLost?.();
    }
  }, [lockState, onLockLost]);

  // heartbeat to keep lock alive when active
  // writes directly to localStorage to avoid triggering React re-renders
  // in the active tab. Other tabs pick up the change via the storage event.
  useEffect(() => {
    if (lockState !== "active" || lockId !== lockIdRef.current) {
      return;
    }

    log.debug("heartbeat start", { interval: ACTIVE_INTERVAL });
    const interval = setInterval(() => {
      try {
        localStorage.setItem(
          APP_LOCK_LAST_ACTIVE_KEY,
          JSON.stringify(Date.now()),
        );
      } catch {
        // localStorage unavailable
      }
    }, ACTIVE_INTERVAL);

    return () => {
      log.debug("heartbeat stop");
      clearInterval(interval);
    };
  }, [lockState, lockId]);

  // release lock on pagehide event
  useEffect(() => {
    // if the lock is not active or the lock ID is not the current session,
    // don't release the lock
    if (lockState !== "active" || lockId !== lockIdRef.current) {
      return;
    }

    const handlePageHide = () => {
      log.info("pagehide, releasing lock");
      releaseLock();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [lockState, lockId, releaseLock]);

  return { lockState, acquireLock, releaseLock };
};
