import { useContext } from "react";
import { ConvoContext } from "@/contexts/ConvoContext";

export const useMessages = () => {
  const context = useContext(ConvoContext);
  if (!context) {
    throw new Error("useMessages must be used within a ConvoProvider");
  }

  return {
    messages: context.messages,
    messagesLoading: context.messagesLoading,
  };
};
