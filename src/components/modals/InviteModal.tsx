import {
  Button,
  CopyButton,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createInviteSlug, getInviteUrl } from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("invite-modal");

type InviteModalProps = {
  onClose: () => void;
};

export const InviteModal: React.FC<InviteModalProps> = ({ onClose }) => {
  const { appData, convo } = useConvo();
  const inboxId = useInboxId();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [includeInfo, setIncludeInfo] = useState(false);

  log.trace("render", {
    convoId: convo.id,
    hasInviteUrl: !!inviteUrl,
    includeInfo,
  });

  useEffect(() => {
    if (!appData) {
      log.debug("invite link generation skipped", { hasAppData: false });
      return;
    }
    const slug = createInviteSlug(convo, appData, inboxId, includeInfo);
    const url = getInviteUrl(slug);
    log.info("invite link generated", { convoId: convo.id, includeInfo });
    setInviteUrl(url);
  }, [convo, appData, inboxId, includeInfo]);

  return (
    <Modal
      onClose={() => {
        log.info("invite modal closed", { convoId: convo.id });
        onClose();
      }}
      size="auto"
      title="Invite">
      <Stack gap="md" align="center">
        {inviteUrl ? (
          <>
            <QRCodeSVG value={inviteUrl} size={280} />
            <Text size="sm" fw={500} ta="center">
              Scan the QR code or share the link below.
            </Text>
            <CopyButton value={inviteUrl}>
              {({ copied, copy }) => (
                <Group gap={0} w="100%">
                  <TextInput
                    flex={1}
                    readOnly
                    value={inviteUrl}
                    styles={{
                      input: {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderRight: "none",
                      },
                    }}
                  />
                  <Tooltip label={copied ? "Copied" : "Copy link"}>
                    <Button
                      color="dark"
                      radius={0}
                      onClick={() => {
                        log.info("invite link copied");
                        copy();
                      }}
                      leftSection={
                        copied ? (
                          <CheckIcon size={14} />
                        ) : (
                          <CopyIcon size={14} />
                        )
                      }
                      styles={{
                        root: {
                          borderTopRightRadius: "var(--mantine-radius-default)",
                          borderBottomRightRadius:
                            "var(--mantine-radius-default)",
                        },
                      }}>
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </Tooltip>
                </Group>
              )}
            </CopyButton>
            <GroupedList>
              <GroupedListItem>
                <InfoIcon size={28} strokeWidth={1.5} />
                <Stack gap={0} flex={1} style={{ overflow: "hidden" }}>
                  <Text size="sm">Include info with invites</Text>
                  <Text size="xs" c="dimmed">
                    Anyone with your convo code can see its name and description
                  </Text>
                </Stack>
                <Switch
                  withThumbIndicator={false}
                  checked={includeInfo}
                  onChange={(e) => {
                    const val = e.currentTarget.checked;
                    log.info("include info toggled", {
                      includeInfo: val,
                    });
                    setIncludeInfo(val);
                  }}
                />
              </GroupedListItem>
            </GroupedList>
          </>
        ) : (
          <Loader size="md" />
        )}
      </Stack>
    </Modal>
  );
};
