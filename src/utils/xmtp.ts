import {
  Client,
  Group,
  IdentifierKind,
  isAttachment,
  isMultiRemoteAttachment,
  isReaction,
  isRemoteAttachment,
  isText,
  isTextReply,
  LogLevel,
  type BuiltInContentTypes,
  type Conversation,
  type DecodedMessage,
  type GroupUpdated,
  type Signer,
} from "@xmtp/browser-sdk";
import { toBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createLogger } from "@/utils/log";
import { version } from "../../package.json";

const log = createLogger("xmtp");
const xmtpEnv = import.meta.env.VITE_XMTP_ENV || "dev";

export const createSigner = (privateKey: Hex): Signer => {
  log.trace("createSigner");
  const account = privateKeyToAccount(privateKey);
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

export const createClient = async (privateKey: Hex) => {
  log.trace("createClient", { env: xmtpEnv });
  const signer = createSigner(privateKey);
  const client = await Client.create(signer, {
    env: xmtpEnv,
    disableDeviceSync: true,
    loggingLevel: LogLevel.Off,
    appVersion: `convos-web/${version}`,
  });
  log.info("client created", { env: xmtpEnv });
  return client;
};

function attachmentLabel(mimeType?: string): string {
  if (!mimeType) return "An attachment was sent";
  if (mimeType.startsWith("image/")) return "An image was sent";
  if (mimeType.startsWith("video/")) return "A video was sent";
  if (mimeType.startsWith("audio/")) return "An audio file was sent";
  return "An attachment was sent";
}

export const getContentString = (message: DecodedMessage) => {
  log.trace("getContentString", { message });
  if (isText(message)) {
    return message.content;
  }
  if (isTextReply(message)) {
    return message.content?.content;
  }
  if (isReaction(message)) {
    return message.content?.content;
  }
  if (isAttachment(message) && message.content) {
    return attachmentLabel(message.content.mimeType);
  }
  if (isRemoteAttachment(message)) {
    return "An attachment was sent";
  }
  if (isMultiRemoteAttachment(message)) {
    return "Attachments were sent";
  }
  return undefined;
};

const metadataFieldLabels: Record<string, string> = {
  group_name: "name",
  description: "description",
  group_image_url_square: "image URL",
};

export const getGroupUpdatedStrings = (
  content: GroupUpdated,
  initiatorName?: string,
  profileNames?: Map<string, { name?: string }>,
): string[] => {
  log.trace("getGroupUpdatedStrings", { content, initiatorName, profileNames });
  const who = initiatorName ?? "Somebody";
  const getName = (inboxId: string) =>
    profileNames?.get(inboxId)?.name ?? "Somebody";
  const lines: string[] = [];

  for (const inbox of content.addedInboxes) {
    lines.push(`${getName(inbox.inboxId)} joined the group`);
  }

  for (const inbox of content.removedInboxes) {
    lines.push(`${getName(inbox.inboxId)} was removed from the group`);
  }

  for (const inbox of content.leftInboxes) {
    lines.push(`${getName(inbox.inboxId)} left the group`);
  }

  for (const change of content.metadataFieldChanges) {
    if (!(change.fieldName in metadataFieldLabels)) continue;
    if (change.fieldName === "group_image_url_square") {
      lines.push(
        change.newValue
          ? `${who} changed the convo photo`
          : `${who} removed the convo photo`,
      );
    } else {
      const field = metadataFieldLabels[change.fieldName];
      lines.push(
        change.newValue
          ? `${who} changed the group ${field} to "${change.newValue}"`
          : `${who} removed the group ${field}`,
      );
    }
  }

  return lines;
};

export const isGroup = <T extends BuiltInContentTypes>(
  conversation?: Conversation<T> | null,
): conversation is Group<T> => {
  return conversation instanceof Group;
};
