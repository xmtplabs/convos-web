import { useClient } from "@/hooks/useClient";

export const useInboxId = (): string => {
  const { client } = useClient();
  return client?.inboxId ?? "";
};
