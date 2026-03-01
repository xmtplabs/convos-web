import {
  Group,
  PermissionPolicy,
  type Conversation,
  type PermissionPolicySet,
} from "@xmtp/browser-sdk";
import { useCallback, useState } from "react";
import { useInboxId } from "@/hooks/useInboxId";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

export type ConvoPermissions = {
  isAdmin: boolean;
  canEditName: boolean;
  canEditDescription: boolean;
  canEditImage: boolean;
  canUpdateAppData: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canLock: boolean;
};

const canPerform = (
  policy: PermissionPolicy,
  isAdmin: boolean,
  isSuperAdmin: boolean,
): boolean => {
  switch (policy) {
    case PermissionPolicy.Allow:
      return true;
    case PermissionPolicy.Deny:
      return false;
    case PermissionPolicy.Admin:
      return isAdmin || isSuperAdmin;
    case PermissionPolicy.SuperAdmin:
      return isSuperAdmin;
    default:
      return false;
  }
};

const resolvePermissions = (
  policySet: PermissionPolicySet,
  isAdmin: boolean,
  isSuperAdmin: boolean,
): ConvoPermissions => {
  const can = (p: PermissionPolicy) => canPerform(p, isAdmin, isSuperAdmin);
  const canUpdateAppData = can(policySet.updateAppDataPolicy);
  return {
    isAdmin: isAdmin || isSuperAdmin,
    canEditName: can(policySet.updateGroupNamePolicy),
    canEditDescription: can(policySet.updateGroupDescriptionPolicy),
    canEditImage:
      can(policySet.updateGroupImageUrlSquarePolicy) && canUpdateAppData,
    canUpdateAppData,
    canAddMembers: can(policySet.addMemberPolicy),
    canRemoveMembers: can(policySet.removeMemberPolicy),
    canLock: isAdmin || isSuperAdmin,
  };
};

export const usePermissions = (conversation: Conversation) => {
  const inboxId = useInboxId();
  const [permissions, setPermissions] = useState<ConvoPermissions | null>(null);

  const refreshPermissions = useCallback(async () => {
    log.trace("refreshing");
    if (!(conversation instanceof Group)) return;
    try {
      const { policySet } = await conversation.permissions();
      const admin = conversation.admins.includes(inboxId);
      const superAdmin = conversation.superAdmins.includes(inboxId);
      const resolved = resolvePermissions(policySet, admin, superAdmin);
      log.debug("permissions resolved", { isAdmin: resolved.isAdmin });
      setPermissions(resolved);
      return policySet;
    } catch (e: unknown) {
      log.error("permissions error", e);
    }
  }, [conversation, inboxId]);

  return { permissions, refreshPermissions };
};
