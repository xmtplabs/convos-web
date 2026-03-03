import {
  ActionIcon,
  Box,
  Button,
  Image,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import type { RemoteAttachment } from "@xmtp/browser-sdk";
import { AlertCircleIcon, EyeIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConvo } from "@/hooks/useConvo";
import { downloadAttachment, getFileType } from "@/utils/attachment";
import { createLogger } from "@/utils/log";
import classes from "./RemoteAttachmentContent.module.css";

const log = createLogger("messaging");

const urlCache = new Map<string, { blobUrl: string | null; failed: boolean }>();

export const RemoteAttachmentContent: React.FC<{
  content: RemoteAttachment;
}> = ({ content }) => {
  const { convo } = useConvo();
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const loadingRef = useRef(false);

  const loadAttachment = useCallback(
    async (force = false) => {
      log.info("loadAttachment start", { url: content.url, force });
      if (loadingRef.current) {
        return;
      }
      loadingRef.current = true;
      setError(null);
      setDecryptedUrl(null);

      if (!force) {
        const cached = urlCache.get(content.url);
        if (cached) {
          log.debug("loadAttachment cache hit", {
            url: content.url,
            failed: cached.failed,
          });
          if (cached.failed) {
            setError("Unable to load attachment");
          } else if (cached.blobUrl) {
            setDecryptedUrl(cached.blobUrl);
          }
          loadingRef.current = false;
          return;
        }
        log.debug("loadAttachment cache miss", { url: content.url });
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
        log.info("loadAttachment download success", { url: content.url });
      } catch (err) {
        log.error("loadAttachment download failed", err);
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

  useEffect(() => {
    setRevealed(false);
  }, [decryptedUrl]);

  if (isLoading) {
    return (
      <Stack
        align="center"
        justify="center"
        gap="xs"
        p="xl"
        className={`${classes.placeholder} ${classes.placeholderLoading}`}>
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
        className={classes.placeholder}>
        <AlertCircleIcon size={24} />
        <Text size="xs" c="dimmed">
          {error}
        </Text>
        <Button
          variant="light"
          radius="xl"
          size="xs"
          onClick={() => {
            log.info("loadAttachment retry", { url: content.url });
            void loadAttachment(true);
          }}>
          Retry
        </Button>
      </Stack>
    );
  }

  if (!decryptedUrl) {
    return null;
  }

  const fileType = getFileType(content.filename ?? "");

  if (fileType === "image") {
    const blurred = convo.blurImages && !revealed;
    return (
      <div className={classes.imageWrapper}>
        <Image
          src={decryptedUrl}
          alt={content.filename ?? "Attachment"}
          maw="100%"
          className={`${classes.image} ${blurred ? classes.imageBlurred : ""}`}
        />
        {blurred && (
          <div className={classes.revealOverlay}>
            <ActionIcon
              variant="filled"
              color="dark"
              radius="xl"
              size="xl"
              onClick={() => {
                setRevealed(true);
              }}>
              <EyeIcon size={24} />
            </ActionIcon>
          </div>
        )}
      </div>
    );
  }

  if (fileType === "video") {
    return <video src={decryptedUrl} controls className={classes.video} />;
  }

  if (fileType === "audio") {
    return (
      <Box p="sm">
        <audio src={decryptedUrl} controls className={classes.audio} />
      </Box>
    );
  }

  return (
    <Text size="sm" c="dimmed" p="sm">
      {content.filename ?? "Attachment"}
    </Text>
  );
};
