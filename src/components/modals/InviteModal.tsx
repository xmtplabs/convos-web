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

  useEffect(() => {
    if (!opened || !appData) {
      return;
    }
    const slug = createInviteSlug(convo, appData, inboxId);
    setInviteUrl(getInviteUrl(slug));
  }, [opened, convo, appData, inboxId]);

  return (
    <Modal opened={opened} onClose={onClose} title="Invite">
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
                    onClick={copy}
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
