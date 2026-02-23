import { db } from "@/db";
import type { AppData } from "@/utils/appData";
import { getPresignedUrl } from "@/utils/attachment";
import { bytesToHex, decrypt, encrypt } from "@/utils/encryption";
import { pinata } from "@/utils/pinata";

export const GROUP_IMAGE_INBOX_ID = "__group__";

export const syncAvatars = async (
  convoId: string,
  appData: AppData,
  signal?: AbortSignal,
): Promise<void> => {
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
        return;
      }

      // Skip if we already have this exact sourceUrl cached
      const existing = await db.avatars.get([convoId, profile.inboxId]);
      if (existing && existing.sourceUrl === img.url) {
        return;
      }

      const response = await fetch(img.url, { signal });
      const ciphertext = new Uint8Array(await response.arrayBuffer());

      if (signal?.aborted) {
        return;
      }

      const plaintext = await decrypt(
        ciphertext,
        keyHex,
        bytesToHex(img.salt),
        bytesToHex(img.nonce),
      );

      if (signal?.aborted) {
        return;
      }

      const base64 = btoa(String.fromCharCode(...plaintext));
      const dataUrl = `data:image/png;base64,${base64}`;

      await db.avatars.put({
        convoId,
        inboxId: profile.inboxId,
        dataUrl,
        sourceUrl: img.url,
      });
    });

  await Promise.allSettled(tasks);

  // Sync group image
  const groupImg = appData.encryptedGroupImage;
  if (!groupImg) {
    await db.avatars.delete([convoId, GROUP_IMAGE_INBOX_ID]);
  } else {
    try {
      if (signal?.aborted) {
        return;
      }
      const existing = await db.avatars.get([convoId, GROUP_IMAGE_INBOX_ID]);
      if (!existing || existing.sourceUrl !== groupImg.url) {
        const response = await fetch(groupImg.url, { signal });
        const ciphertext = new Uint8Array(await response.arrayBuffer());
        if (signal?.aborted) {
          return;
        }
        const plaintext = await decrypt(
          ciphertext,
          keyHex,
          bytesToHex(groupImg.salt),
          bytesToHex(groupImg.nonce),
        );
        if (signal?.aborted) {
          return;
        }
        const base64 = btoa(String.fromCharCode(...plaintext));
        const dataUrl = `data:image/png;base64,${base64}`;
        await db.avatars.put({
          convoId,
          inboxId: GROUP_IMAGE_INBOX_ID,
          dataUrl,
          sourceUrl: groupImg.url,
        });
      }
    } catch {
      // Group image sync failure is non-fatal
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
