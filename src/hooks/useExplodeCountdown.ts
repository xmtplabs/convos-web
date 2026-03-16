import { useEffect, useRef, useState } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("use-explode-countdown");

const format = (ms: number): string => {
  if (ms <= 0) return "00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const useExplodeCountdown = (expiresAtUnix?: number): string | null => {
  const [countdown, setCountdown] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (expiresAtUnix == null) {
      log.trace("countdown stopped");
      setCountdown(null);
      return;
    }
    log.trace("countdown started", { expiresAtUnix });

    const tick = () => {
      const ms = expiresAtUnix * 1000 - Date.now();
      setCountdown(format(ms));
    };

    tick();
    intervalRef.current = setInterval(tick, 1_000);

    return () => {
      if (intervalRef.current != null) {
        log.trace("clearing interval");
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAtUnix]);

  return countdown;
};
