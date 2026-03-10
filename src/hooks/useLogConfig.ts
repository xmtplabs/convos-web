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

type DomainConfig = Partial<Record<LogDomain, LogLevel>>;

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
    setGlobalLogLevel(globalLevel);
  }, [globalLevel]);

  useEffect(() => {
    setDomainLogLevels(domainLevels);
  }, [domainLevels]);
}
