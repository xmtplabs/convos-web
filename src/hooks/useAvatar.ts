import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";

export const useAvatar = (convoId: string, inboxId: string): string | null => {
  return (
    useLiveQuery(() => db.avatars.get([convoId, inboxId]), [convoId, inboxId])
      ?.dataUrl ?? null
  );
};
