import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  isText,
  type Client,
  type DecodedMessage,
  type Group,
} from "@xmtp/browser-sdk";
import { generatePrivateKey } from "viem/accounts";
import { type Convo } from "@/db";
import {
  InvitePayloadSchema,
  SignedInviteSchema,
  type InvitePayload,
} from "@/gen/convos/v1/invite_pb";
import type { AppData } from "@/utils/appData";
import { addConvo } from "@/utils/db";
import { bytesToHex, hexToBytes } from "@/utils/encryption";
import { createLogger } from "@/utils/log";
import { createClient } from "@/utils/xmtp";

const log = createLogger("invite");

const SALT = new TextEncoder().encode("ConvosInviteV1");
const encoder = new TextEncoder();

/**
 * Pack a conversation ID into the binary format expected by the iOS client.
 * Type tag 0x02 (UTF-8 string) + length prefix + UTF-8 bytes.
 */
const packConversationId = (conversationId: string): Uint8Array => {
  log.trace("packConversationId", { conversationId });
  const utf8 = encoder.encode(conversationId);
  const len = utf8.length;

  let header: Uint8Array;
  if (len <= 255) {
    header = new Uint8Array([0x02, len]);
  } else {
    header = new Uint8Array([0x02, 0x00, (len >> 8) & 0xff, len & 0xff]);
  }

  const result = new Uint8Array(header.length + utf8.length);
  result.set(header);
  result.set(utf8, header.length);
  return result;
};

/**
 * Encrypt the conversation ID using ChaCha20-Poly1305 with HKDF-derived key.
 * Returns: version(1) | nonce(12) | ciphertext(variable) | authTag(16)
 */
const encryptConversationToken = (
  conversationId: string,
  privateKeyBytes: Uint8Array,
  inboxId: string,
) => {
  log.trace("encryptConversationToken", { conversationId, inboxId });
  const info = encoder.encode("inbox:" + inboxId);
  const key = hkdf(sha256, privateKeyBytes, SALT, info, 32);

  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);

  const aad = encoder.encode(inboxId);
  const plaintext = packConversationId(conversationId);

  const cipher = chacha20poly1305(key, nonce, aad);
  const sealed = cipher.encrypt(plaintext);
  // sealed = ciphertext || authTag (16 bytes)

  // output: version(1) | nonce(12) | sealed(ciphertext + authTag)
  const result = new Uint8Array(1 + 12 + sealed.length);
  result[0] = 0x01; // version
  result.set(nonce, 1);
  result.set(sealed, 13);
  return result;
};

/**
 * Sign serialized payload bytes with secp256k1 ECDSA (recoverable).
 * Returns 65 bytes: r(32) | s(32) | recoveryId(1)
 */
const signPayload = (payloadBytes: Uint8Array, privateKeyBytes: Uint8Array) => {
  log.trace("signPayload", { payloadBytes: payloadBytes.length });
  const hash = sha256(payloadBytes);
  // recovered format: recovery(1) | r(32) | s(32)
  const sig = secp256k1.sign(hash, privateKeyBytes, { format: "recovered" });

  // iOS expects: r(32) | s(32) | recovery(1)
  const result = new Uint8Array(65);
  result.set(sig.subarray(1), 0); // compact sig (64 bytes)
  result[64] = sig[0]; // recovery ID
  return result;
};

/**
 * Base64url encode without padding, inserting '*' every 300 chars.
 */
const toUrlSafeSlug = (data: Uint8Array): string => {
  log.trace("toUrlSafeSlug", { data: data.length });
  // convert to base64, then to base64url
  let b64 = btoa(String.fromCharCode(...data));
  b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // insert '*' every 300 characters
  if (b64.length <= 300) {
    return b64;
  }
  const parts: string[] = [];
  for (let i = 0; i < b64.length; i += 300) {
    parts.push(b64.slice(i, i + 300));
  }
  return parts.join("*");
};

export const createInviteSlug = (
  convo: Convo,
  appData: AppData,
  inboxId: string,
): string => {
  const includeInfo = convo.inviteIncludesInfo ?? false;
  log.trace("createInviteSlug", { convoId: convo.id, includeInfo });
  if (!convo.xmtpId) {
    log.error("cannot create invite for convo without xmtpId", {
      convoId: convo.id,
    });
    throw new Error("cannot create invite for convo without xmtpId");
  }
  // strip 0x prefix from private key hex and decode to bytes
  const pkHex = convo.privateKey.startsWith("0x")
    ? convo.privateKey.slice(2)
    : convo.privateKey;
  const privateKeyBytes = hexToBytes(pkHex);

  // encrypt conversation token
  const conversationToken = encryptConversationToken(
    convo.xmtpId,
    privateKeyBytes,
    inboxId,
  );

  // build InvitePayload
  const payload = create(InvitePayloadSchema, {
    conversationToken,
    creatorInboxId: hexToBytes(inboxId),
    tag: appData.tag,
    ...(includeInfo && {
      name: convo.name,
      description: convo.description,
    }),
  });

  const payloadBytes = toBinary(InvitePayloadSchema, payload);

  // sign
  const signature = signPayload(payloadBytes, privateKeyBytes);

  // wrap in SignedInvite
  const signedInvite = create(SignedInviteSchema, {
    payload: payloadBytes,
    signature,
  });

  const signedBytes = toBinary(SignedInviteSchema, signedInvite);
  return toUrlSafeSlug(signedBytes);
};

export const getInviteUrl = (slug: string): string => {
  return `${window.location.origin}/i/${slug}`;
};

export type ParsedInvite = {
  payload: InvitePayload;
  creatorInboxId: string;
  slug: string;
};

export const parseInviteSlug = (slug: string): ParsedInvite => {
  log.trace("parseInviteSlug");
  // strip '*' separators
  const b64 = slug.replace(/\*/g, "");

  // base64url → standard base64
  let standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  // add padding
  const pad = standard.length % 4;
  if (pad) {
    standard += "=".repeat(4 - pad);
  }

  // decode to bytes
  const binary = atob(standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // deserialize SignedInvite
  const signedInvite = fromBinary(SignedInviteSchema, bytes);

  // deserialize InvitePayload from signedInvite.payload
  const payload = fromBinary(InvitePayloadSchema, signedInvite.payload);

  // convert creatorInboxId bytes to hex string
  const creatorInboxId = bytesToHex(payload.creatorInboxId);

  return { payload, creatorInboxId, slug };
};

export const sendJoinRequest = async (parsed: ParsedInvite) => {
  log.trace("sendJoinRequest", { creatorInboxId: parsed.creatorInboxId });
  const { creatorInboxId, slug, payload } = parsed;
  const privateKey = generatePrivateKey();
  const client = await createClient(privateKey);
  try {
    await client.conversations.sync();
    const dm = await client.conversations.createDm(creatorInboxId);
    await dm.sendText(slug);
    log.info("join request sent", { creatorInboxId });

    const convo: Convo = {
      id: crypto.randomUUID(),
      privateKey,
      xmtpId: "",
      name: payload.name || "New Convo",
      description: payload.description || undefined,
      imageUrl: payload.imageUrl || undefined,
      tag: payload.tag || undefined,
      status: "pending",
      creatorInboxId,
      slug,
    };

    await addConvo(convo);
    return convo;
  } finally {
    client.close();
  }
};

export const processDmInvite = async (
  message: DecodedMessage,
  tag: string,
  group: Group,
) => {
  log.trace("processDmInvite", { senderInboxId: message.senderInboxId });
  if (!isText(message) || !message.content) {
    return false;
  }
  try {
    const parsed = parseInviteSlug(message.content);
    if (parsed.payload.tag !== tag) {
      log.debug("processDmInvite: tag mismatch");
      return false;
    }
    await group.addMembers([message.senderInboxId]);
    log.info("processDmInvite: member added", {
      senderInboxId: message.senderInboxId,
    });
    return true;
  } catch (err) {
    log.debug("processDmInvite: not an invite message", err);
    return false;
  }
};

export const processExistingDms = async (
  client: Client,
  tag: string,
  group: Group,
) => {
  log.trace("processExistingDms");
  await client.conversations.sync();
  const dms = await client.conversations.listDms();
  log.debug("processExistingDms", { dmCount: dms.length });
  for (const dm of dms) {
    await dm.sync();
    const messages = await dm.messages();
    for (const message of messages) {
      await processDmInvite(message, tag, group);
    }
  }
};

export const resendJoinRequest = async (convo: Convo): Promise<void> => {
  log.trace("resendJoinRequest", { convoId: convo.id });
  if (!convo.slug || !convo.creatorInboxId) {
    throw new Error("Missing slug or creatorInboxId for re-request");
  }
  const client = await createClient(convo.privateKey);
  try {
    const dm = await client.conversations.createDm(convo.creatorInboxId);
    await dm.sendText(convo.slug);
    log.info("join request re-sent", { convoId: convo.id });
  } finally {
    client.close();
  }
};
