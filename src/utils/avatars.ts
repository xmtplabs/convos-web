import { db } from "@/db";
import type { AppData } from "@/utils/appData";
import { getPresignedUrl } from "@/utils/attachment";
import { bytesToHex, decrypt, encrypt } from "@/utils/encryption";
import { createLogger } from "@/utils/log";
import { pinata } from "@/utils/pinata";

const log = createLogger("avatars");

export const GROUP_IMAGE_INBOX_ID = "__group__";

const uint8ToDataUrl = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/png;base64,${btoa(binary)}`;
};

export const syncAvatars = async (
  convoId: string,
  appData: AppData,
  signal?: AbortSignal,
): Promise<void> => {
  log.trace("syncAvatars", { convoId, profileCount: appData.profiles.length });
  const keyBytes = appData.imageEncryptionKey;
  if (!keyBytes || keyBytes.length === 0) {
    return;
  }
  const keyHex = bytesToHex(keyBytes);

  const tasks = appData.profiles
    .filter((p) => p.encryptedImage)
    .map(async (profile) => {
      const img = profile.encryptedImage;
      if (!img) {
        return;
      }
      if (signal?.aborted) {
        log.info("avatar sync aborted", { convoId, inboxId: profile.inboxId });
        return;
      }

      // skip if we already have this exact sourceUrl cached
      const existing = await db.avatars.get([convoId, profile.inboxId]);
      if (existing && existing.sourceUrl === img.url) {
        return;
      }

      log.info("fetching avatar", {
        convoId,
        inboxId: profile.inboxId,
        url: img.url,
      });
      const response = await fetch(img.url, { signal });

      if (!response.ok) {
        log.error("failed to fetch avatar", {
          convoId,
          inboxId: profile.inboxId,
          url: img.url,
          status: response.status,
          statusText: response.statusText,
        });
        return;
      }

      const ciphertext = new Uint8Array(await response.arrayBuffer());

      if (signal?.aborted) {
        log.info("avatar sync aborted", { convoId, inboxId: profile.inboxId });
        return;
      }

      log.info("decrypting avatar");
      const plaintext = await decrypt(
        ciphertext,
        keyHex,
        bytesToHex(img.salt),
        bytesToHex(img.nonce),
      );

      if (signal?.aborted) {
        log.info("avatar sync aborted", { convoId, inboxId: profile.inboxId });
        return;
      }

      const dataUrl = uint8ToDataUrl(plaintext);

      log.info("saving avatar", { convoId, inboxId: profile.inboxId, dataUrl });
      await db.avatars.put({
        convoId,
        inboxId: profile.inboxId,
        dataUrl,
        sourceUrl: img.url,
      });
    });

  await Promise.allSettled(tasks);

  // sync group image
  const groupImg = appData.encryptedGroupImage;
  if (!groupImg) {
    log.info("deleting group image", {
      convoId,
      inboxId: GROUP_IMAGE_INBOX_ID,
    });
    await db.avatars.delete([convoId, GROUP_IMAGE_INBOX_ID]);
  } else {
    try {
      if (signal?.aborted) {
        log.info("group image sync aborted", {
          convoId,
          inboxId: GROUP_IMAGE_INBOX_ID,
        });
        return;
      }
      const existing = await db.avatars.get([convoId, GROUP_IMAGE_INBOX_ID]);
      if (!existing || existing.sourceUrl !== groupImg.url) {
        const response = await fetch(groupImg.url, { signal });
        if (!response.ok) {
          log.error("failed to fetch group image", {
            convoId,
            inboxId: GROUP_IMAGE_INBOX_ID,
            url: groupImg.url,
            status: response.status,
            statusText: response.statusText,
          });
          return;
        }
        const ciphertext = new Uint8Array(await response.arrayBuffer());
        if (signal?.aborted) {
          log.info("group image sync aborted", {
            convoId,
            inboxId: GROUP_IMAGE_INBOX_ID,
          });
          return;
        }
        const plaintext = await decrypt(
          ciphertext,
          keyHex,
          bytesToHex(groupImg.salt),
          bytesToHex(groupImg.nonce),
        );
        if (signal?.aborted) {
          log.info("group image sync aborted", {
            convoId,
            inboxId: GROUP_IMAGE_INBOX_ID,
          });
          return;
        }
        const dataUrl = uint8ToDataUrl(plaintext);
        log.info("saving group image", {
          convoId,
          inboxId: GROUP_IMAGE_INBOX_ID,
          dataUrl,
        });
        await db.avatars.put({
          convoId,
          inboxId: GROUP_IMAGE_INBOX_ID,
          dataUrl,
          sourceUrl: groupImg.url,
        });
      }
    } catch (err) {
      log.warn("group image sync failed (non-fatal)", err);
    }
  }
};

export const clearAvatars = async (convoId: string): Promise<void> => {
  await db.avatars.where("convoId").equals(convoId).delete();
};

export const clearAllAvatars = async (): Promise<void> => {
  await db.avatars.clear();
};

export const uploadAvatar = async (
  data: Uint8Array<ArrayBuffer>,
  groupKeyHex: string,
): Promise<{ url: string; salt: string; nonce: string }> => {
  const { ciphertext, salt, nonce } = await encrypt(data, groupKeyHex);

  const blob = new Blob([ciphertext], { type: "application/octet-stream" });
  const file = new File([blob], "avatar.enc", {
    type: "application/octet-stream",
  });

  const presignedUrl = await getPresignedUrl();
  const upload = await pinata.upload.public.file(file).url(presignedUrl);
  const url = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${upload.cid}`;

  return { url, salt, nonce };
};
