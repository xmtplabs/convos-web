import {
  ConsentState,
  Group as XmtpGroup,
  type Conversation,
} from "@xmtp/browser-sdk";
import type {
  ContentCodec,
  ContentTypeId,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import { db } from "@/db";
import { updateExpiresAt } from "@/utils/appData";
import { updateConvo } from "@/utils/db";
import { createLogger } from "@/utils/log";
import { unregisterConvo } from "@/utils/notifications";

const log = createLogger("explode");
const contentTypeLog = createLogger("explode-content-type");

export type ExplodeSettingsContent = {
  expiresAt: Date;
};

export const ExplodeSettingsContentType: ContentTypeId = {
  authorityId: "convos.org",
  typeId: "explode_settings",
  versionMajor: 1,
  versionMinor: 0,
};

export const ExplodeSettingsCodec: ContentCodec<ExplodeSettingsContent> = {
  contentType: ExplodeSettingsContentType,

  encode(content: ExplodeSettingsContent): EncodedContent {
    contentTypeLog.trace("encode", {
      content,
    });
    const json = JSON.stringify({
      expiresAt: content.expiresAt.toISOString(),
    });
    return {
      type: ExplodeSettingsContentType,
      parameters: {},
      content: new TextEncoder().encode(json),
    };
  },

  decode(content: EncodedContent): ExplodeSettingsContent {
    contentTypeLog.trace("decode");
    const json = new TextDecoder().decode(content.content);
    const parsed = JSON.parse(json) as { expiresAt: string };
    return {
      expiresAt: new Date(parsed.expiresAt),
    };
  },

  fallback(content: ExplodeSettingsContent): string {
    return `This conversation will explode on ${content.expiresAt.toLocaleDateString()}`;
  },

  shouldPush(): boolean {
    return true;
  },
};

export const isExplodeSettings = (msg: {
  contentType: ContentTypeId;
}): boolean =>
  msg.contentType.authorityId === ExplodeSettingsContentType.authorityId &&
  msg.contentType.typeId === ExplodeSettingsContentType.typeId;

export const setExplodeTimer = async (
  conversation: Conversation,
  convoId: string,
  expiresAt: Date,
  selfInboxId: string,
  installationId?: string,
) => {
  log.trace("setExplodeTimer", {
    convoId,
    expiresAt: expiresAt.toISOString(),
    selfInboxId,
  });
  if (!(conversation instanceof XmtpGroup)) {
    throw new Error("Explode is only supported for group conversations");
  }

  const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);

  // send explode message immediately so other clients get notified (matches iOS)
  const encoded = ExplodeSettingsCodec.encode({ expiresAt });
  await conversation.send(encoded);
  log.info("explode message sent", { convoId, expiresAtUnix });

  // sync to other members via XMTP appData (network call)
  await updateExpiresAt(conversation, BigInt(expiresAtUnix));

  // update local Dexie for UI feedback
  await updateConvo(convoId, { expiresAtUnix });
  log.info("explode timer set", { convoId, expiresAtUnix });

  // if already expired, remove members, deny consent, and delete locally
  if (expiresAtUnix <= Math.floor(Date.now() / 1000)) {
    await cleanUpExplodedConvo(
      conversation,
      convoId,
      selfInboxId,
      installationId,
    );
  }
};

// remove all other members, deny consent, and delete from local DB
export const cleanUpExplodedConvo = async (
  conversation: Conversation,
  convoId: string,
  selfInboxId: string,
  installationId?: string,
) => {
  log.info("cleaning up exploded convo", { convoId, selfInboxId });

  if (conversation instanceof XmtpGroup) {
    try {
      const members = await conversation.members();
      const otherInboxIds = members
        .map((m) => m.inboxId)
        .filter((id) => id !== selfInboxId);
      if (otherInboxIds.length > 0) {
        await conversation.removeMembers(otherInboxIds);
        log.info("removed members", { convoId, count: otherInboxIds.length });
      }
    } catch (err: unknown) {
      log.error("failed to remove members", { convoId }, err);
    }

    try {
      await conversation.updateConsentState(ConsentState.Denied);
      log.info("denied consent", { convoId });
    } catch (err: unknown) {
      log.error("failed to deny consent", { convoId }, err);
    }
  }

  if (installationId) {
    await unregisterConvo(installationId).catch((err: unknown) => {
      log.warn("push unregister failed", { convoId }, err);
    });
  }

  await db.avatars.where("convoId").equals(convoId).delete();
  await db.convos.delete(convoId);
  log.info("exploded convo deleted", { convoId });
};

export const getNextSunday = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};
