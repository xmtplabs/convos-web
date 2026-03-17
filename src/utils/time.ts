export const formatTimeLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (diffDays === 0) {
    return `Today, ${time}`;
  }
  if (diffDays === 1) {
    return `Yesterday, ${time}`;
  }

  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
  return `${dateStr}, ${time}`;
};

export const getMinuteKey = (sentAtNs: bigint): string => {
  const ms = Number(sentAtNs / 1_000_000n);
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
};

export const formatDuration = (ms: number): string => {
  if (ms <= 0) return "now";
  const s = Math.round(ms / 1000);
  if (s >= 79200) {
    const days = Math.round(s / 86400);
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  if (s >= 3000) {
    const hours = Math.round(s / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  if (s >= 50) {
    const minutes = Math.round(s / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return `${s} second${s !== 1 ? "s" : ""}`;
};
