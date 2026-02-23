import { useContext } from "react";
import { XmtpContext } from "@/contexts/XmtpContext";

export const useClient = () => {
  const context = useContext(XmtpContext);
  if (!context) {
    throw new Error("useClient must be used within an XmtpProvider");
  }
  return context;
};
