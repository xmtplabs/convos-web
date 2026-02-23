import {
  Client,
  IdentifierKind,
  isReaction,
  isText,
  isTextReply,
  LogLevel,
  type DecodedMessage,
  type GroupUpdated,
  type Signer,
} from "@xmtp/browser-sdk";
import { toBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { version } from "../../package.json";

const xmtpEnv = import.meta.env.VITE_XMTP_ENV || "dev";

export const createSigner = (privateKey: Hex): Signer => {
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
  const signer = createSigner(privateKey);
  return await Client.create(signer, {
    env: xmtpEnv,
    disableDeviceSync: true,
    loggingLevel: LogLevel.Off,
    appVersion: `convos-web/${version}`,
  });
};

export const buildClient = async (privateKey: Hex) => {
  const signer = createSigner(privateKey);
  const identifier = await signer.getIdentifier();
  return Client.build(identifier, {
    env: xmtpEnv,
    disableDeviceSync: true,
    loggingLevel: LogLevel.Off,
    appVersion: `convos-web/${version}`,
  });
};

export const getContentString = (message: DecodedMessage) => {
  if (isText(message)) {
    return message.content;
  }
  if (isTextReply(message)) {
    return message.content?.content;
  }
  if (isReaction(message)) {
    return message.content?.content;
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
