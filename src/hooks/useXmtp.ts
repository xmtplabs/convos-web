import { useContext } from "react";
import { XmtpContext } from "@/contexts/XmtpContext";

export const useXmtp = () => {
  const context = useContext(XmtpContext);
  if (!context) {
    throw new Error("useXmtp must be used within an XmtpProvider");
  }
  return context;
};
