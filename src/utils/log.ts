export const LOG_DOMAINS = [
  "active-convo",
  "app-lock",
  "app",
  "appData",
  "attachment",
  "avatars",
  "convo-details",
  "convo-header",
  "convo-id-route",
  "convo-provider",
  "convo",
  "convos-list",
  "db",
  "delete-all-data",
  "edit-convo",
  "encryption",
  "explode-content-type",
  "explode-menu",
  "explode-worker",
  "explode",
  "filter-menu",
  "invite-modal",
  "invite-process",
  "invite",
  "layout",
  "members-list",
  "messaging",
  "not-found",
  "notifications-api-health",
  "notifications-api-subscribe",
  "notifications-api-unsubscribe",
  "notifications-api-vapid-key",
  "notifications-server",
  "notifications",
  "qrcode",
  "quickname",
  "rate-limit",
  "root",
  "router",
  "settings",
  "upload-url-api",
  "use-app-data",
  "use-convo-actions",
  "use-convo-db",
  "use-convo-details",
  "use-convo-explode",
  "use-convo",
  "use-create-convo",
  "use-log-config",
  "use-messages",
  "use-permissions",
  "use-profile-avatar",
  "use-send-message",
  "use-service-worker-decrypt",
  "use-service-worker-sync",
  "use-service-worker",
  "welcome",
  "xmtp-lock",
  "xmtp",
] as const;

export type LogDomain = (typeof LOG_DOMAINS)[number];

export const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "off",
] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
type OutputLevel = Exclude<LogLevel, "off">;

const LEVEL_INDEX: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  off: 5,
};

const isValidDomain = (value: string): value is LogDomain =>
  (LOG_DOMAINS as readonly string[]).includes(value);

const isValidLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

export const LOG_LEVEL_KEY = "convos-log-level";
export const LOG_DOMAINS_KEY = "convos-log-domains";

type DomainConfig = Partial<Record<LogDomain, LogLevel>>;

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

const parseEnvDomains = (): DomainConfig => {
  const raw = getEnv("LOG_DOMAINS");
  if (!raw) return {};
  const config: DomainConfig = {};
  for (const entry of raw.split(",")) {
    const [domain, level] = entry.split(":").map((s) => s.trim()) as [
      string,
      string,
    ];
    if (isValidDomain(domain) && isValidLevel(level)) {
      config[domain] = level;
    }
  }
  return config;
};

const getDefaultLogLevel = (): LogLevel => {
  const raw = getEnv("LOG_LEVEL")?.trim();
  if (raw && isValidLevel(raw)) {
    return raw;
  }
  const xmtpEnv = getEnv("XMTP_ENV");
  if (xmtpEnv === "production") {
    return "off";
  }
  return "trace";
};

let globalLogLevel: LogLevel | null = null;
let domainLogLevels: DomainConfig = {};

export const setGlobalLogLevel = (level: LogLevel | null): void => {
  globalLogLevel = level;
};

export const setDomainLogLevels = (levels: DomainConfig): void => {
  domainLogLevels = levels;
};

const resolveLevel = (domain: LogDomain): LogLevel => {
  const domainLogLevel = domainLogLevels[domain];
  if (domainLogLevel) {
    return domainLogLevel;
  }
  if (globalLogLevel) {
    return globalLogLevel;
  }
  const envDomain = parseEnvDomains()[domain];
  if (envDomain) {
    return envDomain;
  }
  return getDefaultLogLevel();
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
