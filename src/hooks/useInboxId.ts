import { useXmtp } from "@/hooks/useXmtp";

export const useInboxId = (): string => {
  const { client } = useXmtp();
  return client?.inboxId ?? "";
};
