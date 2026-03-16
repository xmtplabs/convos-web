import { createLogger } from "@/utils/log";

const log = createLogger("encryption");

const INFO = new TextEncoder().encode("ConvosImageV1");

export const hexToBytes = (hex: string) => {
  log.trace("hexToBytes", { hex });
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  log.debug("hexToBytes complete", { bytes });
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array) => {
  log.trace("bytesToHex", { bytes: bytes.length });
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  log.debug("bytesToHex complete", { hex });
  return hex;
};

export const generateKey = () => {
  log.trace("generateKey");
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return bytesToHex(key);
};

export const generateSalt = () => {
  log.trace("generateSalt");
  const salt = new Uint8Array(32);
  return crypto.getRandomValues(salt);
};

export const generateNonce = () => {
  log.trace("generateNonce");
  const nonce = new Uint8Array(12);
  return crypto.getRandomValues(nonce);
};

const deriveKey = async (key: string, saltBytes: Uint8Array<ArrayBuffer>) => {
  log.trace("deriveKey", { key, saltBytes });
  const keyBytes = hexToBytes(key);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: saltBytes, info: INFO },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const encrypt = async (
  imageData: Uint8Array<ArrayBuffer>,
  key: string,
) => {
  log.trace("encrypt", { inputSize: imageData.byteLength });
  const salt = generateSalt();
  const nonce = generateNonce();
  const derivedKey = await deriveKey(key, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    derivedKey,
    imageData,
  );

  log.debug("encrypt complete", { outputSize: encrypted.byteLength });
  return {
    ciphertext: new Uint8Array(encrypted),
    salt: bytesToHex(salt),
    nonce: bytesToHex(nonce),
  };
};

export const decrypt = async (
  ciphertext: Uint8Array<ArrayBuffer>,
  key: string,
  salt: string,
  nonce: string,
) => {
  log.trace("decrypt", { inputSize: ciphertext.byteLength });
  const saltBytes = hexToBytes(salt);
  const nonceBytes = hexToBytes(nonce);
  const derivedKey = await deriveKey(key, saltBytes);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonceBytes },
    derivedKey,
    ciphertext,
  );

  log.debug("decrypt complete", { outputSize: decrypted.byteLength });
  return new Uint8Array(decrypted);
};
