import {
  Button,
  CopyButton,
  Loader,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { CheckIcon, CopyIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createInviteSlug, getInviteUrl } from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("invite");

type InviteModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const InviteModal: React.FC<InviteModalProps> = ({
  opened,
  onClose,
}) => {
  const { appData, convo } = useConvo();
  const inboxId = useInboxId();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  log.trace("render", {
    convoId: convo.id,
    hasInviteUrl: !!inviteUrl,
  });

  useEffect(() => {
    if (!opened || !appData) {
      log.debug("invite link generation skipped", {
        opened,
        hasAppData: !!appData,
      });
      return;
    }
    const slug = createInviteSlug(convo, appData, inboxId);
    const url = getInviteUrl(slug);
    log.info("invite link generated", { convoId: convo.id });
    setInviteUrl(url);
  }, [opened, convo, appData, inboxId]);

  return (
    <Modal
      opened={opened}
      onClose={() => {
        log.info("invite modal closed", { convoId: convo.id });
        onClose();
      }}
      title="Invite">
      <Stack gap="md" align="center">
        {inviteUrl ? (
          <>
            <QRCodeSVG value={inviteUrl} size={200} />
            <Text
              size="xs"
              c="dimmed"
              style={{ wordBreak: "break-all", textAlign: "center" }}>
              {inviteUrl}
            </Text>
            <CopyButton value={inviteUrl}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Copied" : "Copy link"}>
                  <Button
                    variant="light"
                    radius="xl"
                    onClick={() => {
                      log.info("invite link copied");
                      copy();
                    }}
                    leftSection={
                      copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />
                    }>
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </>
        ) : (
          <Loader size="md" />
        )}
      </Stack>
    </Modal>
  );
};
