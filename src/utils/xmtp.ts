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
    env: "dev",
    disableDeviceSync: true,
    loggingLevel: LogLevel.Off,
    appVersion: `convos-web/${version}`,
  });
};

export const buildClient = async (privateKey: Hex) => {
  const signer = createSigner(privateKey);
  const identifier = await signer.getIdentifier();
  return Client.build(identifier, {
    env: "dev",
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
): string[] => {
  const who = initiatorName ?? "Somebody";
  return content.metadataFieldChanges
    .filter((change) => change.fieldName in metadataFieldLabels)
    .map((change) => {
      if (change.fieldName === "group_image_url_square") {
        if (change.newValue) {
          return `${who} changed the convo photo`;
        }
        return `${who} removed the convo photo`;
      }
      const field = metadataFieldLabels[change.fieldName];
      if (change.newValue) {
        return `${who} changed the group ${field} to "${change.newValue}"`;
      }
      return `${who} removed the group ${field}`;
    });
};
