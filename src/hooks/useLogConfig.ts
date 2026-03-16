import { useLocalStorage } from "@mantine/hooks";
import { useEffect } from "react";
import {
  LOG_DOMAINS_KEY,
  LOG_LEVEL_KEY,
  setDomainLogLevels,
  setGlobalLogLevel,
  type LogDomain,
  type LogLevel,
} from "@/utils/log";
import { createLogger } from "@/utils/log";

type DomainConfig = Partial<Record<LogDomain, LogLevel>>;

const log = createLogger("use-log-config");

export function useLogConfig() {
  const [globalLevel] = useLocalStorage<LogLevel | null>({
    key: LOG_LEVEL_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });

  const [domainLevels] = useLocalStorage<DomainConfig>({
    key: LOG_DOMAINS_KEY,
    defaultValue: {},
    getInitialValueInEffect: false,
  });

  useEffect(() => {
    log.trace("setting global log level", { globalLevel });
    setGlobalLogLevel(globalLevel);
  }, [globalLevel]);

  useEffect(() => {
    log.trace("setting domain log levels", { domainLevels });
    setDomainLogLevels(domainLevels);
  }, [domainLevels]);
}
