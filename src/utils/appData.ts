import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import type { Group } from "@xmtp/browser-sdk";
import type { Profile } from "@/db";
import {
  ConversationCustomMetadataSchema,
  ConversationProfileSchema,
  EncryptedImageRefSchema,
  type ConversationCustomMetadata,
} from "@/gen/convos/v1/conversation_custom_metadata_pb";
import { uploadAvatar } from "@/utils/avatars";
import {
  bytesToHex,
  decrypt,
  generateKey,
  hexToBytes,
} from "@/utils/encryption";
import { createLogger } from "@/utils/log";

const log = createLogger("appData");

export type EncryptedImageRef = {
  url: string;
  salt: Uint8Array;
  nonce: Uint8Array;
};

export type MemberProfile = {
  inboxId: string;
  name?: string;
  encryptedImage?: EncryptedImageRef;
};

export type AppData = {
  tag: string;
  profiles: MemberProfile[];
  expiresAtUnix?: bigint;
  imageEncryptionKey?: Uint8Array;
  encryptedGroupImage?: EncryptedImageRef;
};

const COMPRESSION_MARKER = 0x1f;
const COMPRESSION_THRESHOLD = 100;

const base64UrlEncode = (bytes: Uint8Array): string => {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64UrlDecode = (str: string): Uint8Array => {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) {
    b64 += "=".repeat(4 - pad);
  }
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

const compress = async (data: Uint8Array): Promise<Uint8Array> => {
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  void writer.write(new Uint8Array(data));
  void writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
};

const decompress = async (data: Uint8Array): Promise<Uint8Array> => {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  void writer.write(new Uint8Array(data));
  void writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
};

const encode = async (
  metadata: ConversationCustomMetadata,
): Promise<string> => {
  const protobuf = toBinary(ConversationCustomMetadataSchema, metadata);

  if (protobuf.length > COMPRESSION_THRESHOLD) {
    const compressed = await compress(protobuf);
    if (compressed.length < protobuf.length) {
      // [marker(1)] [originalSize BE uint32(4)] [compressed data]
      const size = new DataView(new ArrayBuffer(4));
      size.setUint32(0, protobuf.length, false);
      const payload = new Uint8Array(1 + 4 + compressed.length);
      payload[0] = COMPRESSION_MARKER;
      payload.set(new Uint8Array(size.buffer), 1);
      payload.set(compressed, 5);
      return base64UrlEncode(payload);
    }
  }

  return base64UrlEncode(protobuf);
};

const decode = async (data: string): Promise<ConversationCustomMetadata> => {
  const binary = base64UrlDecode(data);

  let protobuf: Uint8Array;
  if (binary[0] === COMPRESSION_MARKER) {
    // skip marker (1 byte) + original size (4 bytes)
    const compressed = binary.slice(5);
    protobuf = await decompress(compressed);
  } else {
    protobuf = binary;
  }

  return fromBinary(ConversationCustomMetadataSchema, protobuf);
};

const normalizeImageRef = (
  ref: { url: string; salt: Uint8Array; nonce: Uint8Array } | undefined,
): EncryptedImageRef | undefined => {
  if (!ref) {
    return undefined;
  }
  return { url: ref.url, salt: ref.salt, nonce: ref.nonce };
};

export const decodeAppData = async (data: string): Promise<AppData> => {
  log.trace("decodeAppData");
  const decoded = await decode(data);
  return {
    tag: decoded.tag,
    profiles: decoded.profiles.map((p) => ({
      inboxId: bytesToHex(p.inboxId),
      name: p.name,
      encryptedImage: normalizeImageRef(p.encryptedImage),
    })),
    expiresAtUnix: decoded.expiresAtUnix,
    imageEncryptionKey: decoded.imageEncryptionKey,
    encryptedGroupImage: normalizeImageRef(decoded.encryptedGroupImage),
  };
};

export const generateTag = () => {
  log.trace("generateTag");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
};

export const initGroupAppData = async (group: Group) => {
  log.trace("initGroupAppData", { groupId: group.id });
  const tag = generateTag();
  const metadata = create(ConversationCustomMetadataSchema, { tag });
  const encoded = await encode(metadata);
  await group.updateAppData(encoded);
  log.info("group appData initialized", { groupId: group.id });
  return tag;
};

export const shareProfileToGroup = async (
  group: Group,
  profile: Profile,
  inboxId: string,
) => {
  log.trace("shareProfileToGroup", { groupId: group.id, inboxId });
  let existing: ConversationCustomMetadata | undefined;
  const currentAppData = group.appData;
  if (currentAppData) {
    try {
      existing = await decode(currentAppData);
    } catch (err) {
      log.error("corrupt appData during shareProfile, starting fresh", err);
    }
  }

  const metadata = existing ?? create(ConversationCustomMetadataSchema);

  // ensure the group has a shared imageEncryptionKey
  let groupKeyBytes = metadata.imageEncryptionKey;
  if (!groupKeyBytes || groupKeyBytes.length === 0) {
    groupKeyBytes = hexToBytes(generateKey());
  }
  metadata.imageEncryptionKey = groupKeyBytes;
  const groupKeyHex = bytesToHex(groupKeyBytes);

  // convert profile avatar to group avatar
  let encryptedImage: EncryptedImageRef | undefined;
  if (
    profile.avatarUrl &&
    profile.avatarKey &&
    profile.avatarSalt &&
    profile.avatarNonce
  ) {
    log.info("downloading profile avatar", { avatarUrl: profile.avatarUrl });
    // download and decrypt profile avatar
    const response = await fetch(profile.avatarUrl);

    if (!response.ok) {
      log.error("failed to download profile avatar", {
        status: response.status,
        statusText: response.statusText,
      });
      return;
    }

    const ciphertext = new Uint8Array(await response.arrayBuffer());
    log.info("decrypting profile avatar", { size: ciphertext.byteLength });
    const plaintext = await decrypt(
      ciphertext,
      profile.avatarKey,
      profile.avatarSalt,
      profile.avatarNonce,
    );

    // re-encrypt avatar with group key and upload
    log.info("uploading profile avatar", { keyHex: groupKeyHex });
    const upload = await uploadAvatar(plaintext, groupKeyHex);
    log.info("uploaded profile avatar", { url: upload.url });
    encryptedImage = {
      url: upload.url,
      salt: hexToBytes(upload.salt),
      nonce: hexToBytes(upload.nonce),
    };
  }

  // create profile
  const newProfile = create(ConversationProfileSchema, {
    inboxId: hexToBytes(inboxId),
    name: profile.name,
    encryptedImage,
  });

  log.info("creating profile", { inboxId, name: profile.name });

  // add/replace profile in metadata
  metadata.profiles = [
    ...metadata.profiles.filter((p) => bytesToHex(p.inboxId) !== inboxId),
    newProfile,
  ];

  log.info("encoding metadata", { metadata });
  const encoded = await encode(metadata);
  log.info("updating group appData", { encoded });
  await group.updateAppData(encoded);
};

export const updateGroupImage = async (
  group: Group,
  imageData: Uint8Array<ArrayBuffer>,
) => {
  log.trace("updateGroupImage", { groupId: group.id });
  let existing: ConversationCustomMetadata | undefined;
  const currentAppData = group.appData;
  if (currentAppData) {
    try {
      existing = await decode(currentAppData);
    } catch (err) {
      log.error("corrupt appData during updateGroupImage, starting fresh", err);
    }
  }

  const metadata = existing ?? create(ConversationCustomMetadataSchema);

  // ensure encryption key
  let imageEncryptionKey = metadata.imageEncryptionKey;
  if (!imageEncryptionKey || imageEncryptionKey.length === 0) {
    imageEncryptionKey = hexToBytes(generateKey());
  }
  metadata.imageEncryptionKey = imageEncryptionKey;

  // encrypt and upload
  log.info("uploading group image", { keyHex: bytesToHex(imageEncryptionKey) });
  const upload = await uploadAvatar(imageData, bytesToHex(imageEncryptionKey));
  log.info("uploaded group image", { url: upload.url });
  metadata.encryptedGroupImage = create(EncryptedImageRefSchema, {
    url: upload.url,
    salt: hexToBytes(upload.salt),
    nonce: hexToBytes(upload.nonce),
  });

  log.info("encoding metadata", { metadata });
  const encoded = await encode(metadata);
  log.info("updating group appData", { encoded });
  await group.updateAppData(encoded);
  await group.updateImageUrl(upload.url);
};

export const removeGroupImage = async (group: Group) => {
  log.trace("removeGroupImage", { groupId: group.id });
  const currentAppData = group.appData;
  if (!currentAppData) {
    return;
  }

  let metadata: ConversationCustomMetadata;
  try {
    log.info("decoding metadata", { currentAppData });
    metadata = await decode(currentAppData);
    log.info("decoded metadata", { metadata });
  } catch (err) {
    log.error("corrupt appData during removeGroupImage", err);
    return;
  }

  metadata.encryptedGroupImage = undefined;

  log.info("encoding metadata", { metadata });
  const encoded = await encode(metadata);
  log.info("updating group appData", { encoded });
  await group.updateAppData(encoded);
  await group.updateImageUrl("");
};

export const updateExpiresAt = async (group: Group, expiresAtUnix: bigint) => {
  log.trace("updateExpiresAt", {
    groupId: group.id,
    expiresAtUnix: Number(expiresAtUnix),
  });
  let existing: ConversationCustomMetadata | undefined;
  const currentAppData = group.appData;
  if (currentAppData) {
    try {
      log.info("decoding metadata", { currentAppData });
      existing = await decode(currentAppData);
      log.info("decoded metadata", { metadata: existing });
    } catch (err) {
      log.error("corrupt appData during updateExpiresAt, starting fresh", err);
    }
  }

  const metadata = existing ?? create(ConversationCustomMetadataSchema);
  log.info("setting expiresAtUnix", { expiresAtUnix });
  metadata.expiresAtUnix = expiresAtUnix;

  log.info("encoding metadata", { metadata });
  const encoded = await encode(metadata);
  log.info("updating group appData", { encoded });
  await group.updateAppData(encoded);
};
