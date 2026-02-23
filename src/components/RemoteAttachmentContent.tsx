import { Box, Button, Loader, Stack, Text } from "@mantine/core";
import type { RemoteAttachment } from "@xmtp/browser-sdk";
import { AlertCircleIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadAttachment, getFileType } from "@/utils/attachment";

const urlCache = new Map<string, { blobUrl: string | null; failed: boolean }>();

export const RemoteAttachmentContent: React.FC<{
  content: RemoteAttachment;
}> = ({ content }) => {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadAttachment = useCallback(
    async (force = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setError(null);
      setDecryptedUrl(null);

      if (!force) {
        const cached = urlCache.get(content.url);
        if (cached) {
          if (cached.failed) {
            setError("Unable to load attachment");
          } else if (cached.blobUrl) {
            setDecryptedUrl(cached.blobUrl);
          }
          loadingRef.current = false;
          return;
        }
      }

      setIsLoading(true);
      try {
        const attachment = await downloadAttachment(content);
        const blob = new Blob([attachment.content as Uint8Array<ArrayBuffer>], {
          type: attachment.mimeType,
        });
        const blobUrl = URL.createObjectURL(blob);
        urlCache.set(content.url, { blobUrl, failed: false });
        setDecryptedUrl(blobUrl);
      } catch {
        setError("Unable to load attachment");
        urlCache.set(content.url, { blobUrl: null, failed: true });
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [content],
  );

  useEffect(() => {
    void loadAttachment();
  }, [loadAttachment]);

  if (isLoading) {
    return (
      <Stack
        align="center"
        justify="center"
        gap="xs"
        p="xl"
        style={{
          minWidth: 200,
          minHeight: 120,
          backgroundColor:
            "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))",
          borderRadius: "var(--mantine-radius-lg)",
        }}>
        <Loader size="sm" />
        <Text size="xs" c="dimmed">
          Loading attachment...
        </Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack
        align="center"
        justify="center"
        gap="xs"
        p="md"
        style={{
          minWidth: 200,
          backgroundColor:
            "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))",
          borderRadius: "var(--mantine-radius-lg)",
        }}>
        <AlertCircleIcon size={24} />
        <Text size="xs" c="dimmed">
          {error}
        </Text>
        <Button
          variant="light"
          radius="xl"
          size="xs"
          onClick={() => {
            void loadAttachment(true);
          }}>
          Retry
        </Button>
      </Stack>
    );
  }

  if (!decryptedUrl) return null;

  const fileType = getFileType(content.filename ?? "");

  if (fileType === "image") {
    return (
      <img
        src={decryptedUrl}
        alt={content.filename ?? "Attachment"}
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />
    );
  }

  if (fileType === "video") {
    return (
      <video
        src={decryptedUrl}
        controls
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />
    );
  }

  if (fileType === "audio") {
    return (
      <Box p="sm">
        <audio
          src={decryptedUrl}
          controls
          style={{ width: "100%", display: "block" }}
        />
      </Box>
    );
  }

  return (
    <Text size="sm" c="dimmed" p="sm">
      {content.filename ?? "Attachment"}
    </Text>
  );
};
