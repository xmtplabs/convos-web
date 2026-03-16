import { useContext } from "react";
import { ConvoContext } from "@/contexts/ConvoContext";

export const useInboxId = (): string => {
  const context = useContext(ConvoContext);
  return context?.client?.inboxId ?? "";
};
