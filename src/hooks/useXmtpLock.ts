import { useContext } from "react";
import {
  XmtpLockContext,
  type XmtpLockContextValue,
} from "@/contexts/XmtpLockContext";

export const useXmtpLock = (): XmtpLockContextValue => {
  const context = useContext(XmtpLockContext);
  if (!context) {
    throw new Error("useXmtpLock must be used within XmtpLockProvider");
  }
  return context;
};
