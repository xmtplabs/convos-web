const OUTPUT_LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
type OutputLevel = (typeof OUTPUT_LEVELS)[number];

const LEVELS = [...OUTPUT_LEVELS, "off"] as const;
export type LogLevel = (typeof LEVELS)[number];
export type LogDomain = string;

const LEVEL_INDEX: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  off: 5,
};

const STORAGE_KEY = "convos-log-config";

type LogConfig = Partial<Record<LogDomain, LogLevel>>;

const getStoredConfig = (): LogConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LogConfig;
  } catch {
    // localStorage unavailable (worker) or corrupt
  }
  return {};
};

const isServer = typeof window === "undefined";

const getEnv = (name: string): string | undefined => {
  if (isServer) {
    try {
      return process.env[name];
    } catch {
      return undefined;
    }
  }
  try {
    return import.meta.env[`VITE_${name}`] as string | undefined;
  } catch {
    return undefined;
  }
};

const parseEnvDomains = (): LogConfig => {
  const raw = getEnv("LOG_DOMAINS");
  if (!raw) return {};
  const config: LogConfig = {};
  for (const entry of raw.split(",")) {
    const [domain, level] = entry.split(":").map((s) => s.trim()) as [
      string,
      string,
    ];
    if (domain && LEVELS.includes(level as LogLevel)) {
      config[domain] = level as LogLevel;
    }
  }
  return config;
};

const getGlobalDefault = (): LogLevel => {
  const raw = getEnv("LOG_LEVEL");
  if (raw && LEVELS.includes(raw.trim() as LogLevel)) {
    return raw.trim() as LogLevel;
  }
  return "trace";
};

const resolveLevel = (domain: LogDomain): LogLevel => {
  // 1. localStorage (highest priority)
  const stored = getStoredConfig()[domain];
  if (stored) return stored;
  // 2. VITE_LOG_DOMAINS
  const envDomain = parseEnvDomains()[domain];
  if (envDomain) return envDomain;
  // 3. VITE_LOG_LEVEL
  return getGlobalDefault();
};

export type Logger = Record<OutputLevel, (...args: unknown[]) => void>;

export const createLogger = (domain: LogDomain): Logger => {
  const make =
    (level: OutputLevel) =>
    (...args: unknown[]) => {
      const threshold = resolveLevel(domain);
      if (LEVEL_INDEX[level] < LEVEL_INDEX[threshold]) return;
      const method =
        level === "trace" || level === "debug"
          ? "debug"
          : level === "info"
            ? "info"
            : level === "warn"
              ? "warn"
              : "error";
      console[method](`[${domain}]`, ...args);
    };
  return {
    trace: make("trace"),
    debug: make("debug"),
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
  };
};
