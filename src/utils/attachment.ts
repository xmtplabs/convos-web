import {
  decryptAttachment,
  encryptAttachment,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/browser-sdk";
import { pinata } from "@/utils/pinata";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export type FileValidation =
  | {
      valid: true;
    }
  | {
      valid: false;
      error: string;
    };

export const validateFile = (file: File): FileValidation => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. File must be an image.",
    };
  }

  return { valid: true };
};

export const getPresignedUrl = async (): Promise<string> => {
  const response = await fetch("/api/v1/upload-url");
  const data = (await response.json()) as { url: string };
  return data.url;
};

export const uploadAttachment = async (
  file: File,
): Promise<RemoteAttachment> => {
  const arrayBuffer = await file.arrayBuffer();
  const attachment = new Uint8Array(arrayBuffer);
  const attachmentData: Attachment = {
    mimeType: file.type,
    filename: file.name,
    content: attachment,
  };
  const encryptedAttachment = await encryptAttachment(attachmentData);
  const encryptedBlob = new Blob(
    [encryptedAttachment.payload as Uint8Array<ArrayBuffer>],
    {
      type: "application/octet-stream",
    },
  );
  const encryptedFile = new File([encryptedBlob], file.name, {
    type: "application/octet-stream",
  });
  const presignedUrl = await getPresignedUrl();
  const upload = await pinata.upload.public
    .file(encryptedFile)
    .url(presignedUrl);
  const url = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${upload.cid}`;

  return {
    url,
    contentDigest: encryptedAttachment.contentDigest,
    salt: encryptedAttachment.salt,
    nonce: encryptedAttachment.nonce,
    secret: encryptedAttachment.secret,
    scheme: "https://",
    contentLength: encryptedAttachment.payload.length,
    filename: file.name,
  };
};

export const downloadAttachment = async (content: RemoteAttachment) => {
  const response = await fetch(content.url);
  if (!response.ok) {
    throw new Error(
      `Unable to load attachment: [${response.status}] ${response.statusText}`,
    );
  }
  const payload = new Uint8Array(await response.arrayBuffer());
  return decryptAttachment(payload, content);
};

export const getFileType = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return "image";
    case "mp4":
    case "webm":
    case "mov":
      return "video";
    case "mp3":
    case "wav":
    case "ogg":
      return "audio";
    default:
      return "file";
  }
};

export const formatFileSize = (fileSize: number) => {
  if (!fileSize) {
    return "";
  }
  const kb = fileSize / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};
