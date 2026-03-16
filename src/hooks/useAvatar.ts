import { useLiveQuery } from "dexie-react-hooks";
import { getAvatar } from "@/utils/db";

export const useAvatar = (convoId: string, inboxId: string): string | null => {
  return (
    useLiveQuery(() => getAvatar(convoId, inboxId), [convoId, inboxId])
      ?.dataUrl ?? null
  );
};
