import {
  Group,
  PermissionPolicy,
  type Conversation,
  type PermissionPolicySet,
} from "@xmtp/browser-sdk";
import { useCallback, useState } from "react";
import { useInboxId } from "@/hooks/useInboxId";

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
    if (!(conversation instanceof Group)) return;
    try {
      const { policySet } = await conversation.permissions();
      const admin = conversation.admins.includes(inboxId);
      const superAdmin = conversation.superAdmins.includes(inboxId);
      setPermissions(resolvePermissions(policySet, admin, superAdmin));
      return policySet;
    } catch (e: unknown) {
      console.error("[convo] permissions error:", e);
    }
  }, [conversation, inboxId]);

  return { permissions, refreshPermissions };
};
