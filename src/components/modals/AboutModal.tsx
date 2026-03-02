import { Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { Quickname } from "@/components/app/Quickname";
import { LinkButton } from "@/components/shared/Button";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { Modal } from "@/components/shared/Modal";
import { useConvos } from "@/hooks/useConvos";
import { createLogger } from "@/utils/log";

const log = createLogger("settings");

export const AboutModal = () => {
  log.trace("render");
  const navigate = useNavigate();
  const convos = useConvos();
  const hasConvos = convos.length > 0;
  const dirtyRef = useRef(false);

  const onDirtyChange = useCallback((dirty: boolean) => {
    log.debug("onDirtyChange", { dirty });
    dirtyRef.current = dirty;
  }, []);

  const onClose = () => {
    if (dirtyRef.current) {
      log.debug("close blocked, form is dirty");
      return;
    }
    log.info("modal closed");
    void navigate({ to: ".", search: { modal: undefined } });
  };

  return (
    <Modal opened onClose={onClose} title="Settings">
      <Stack gap="md">
        <Stack gap="xs">
          <Title order={3}>My info</Title>
          <Stack gap="xxxs">
            <Text size="sm">Private unless you choose to share it</Text>
            <Text size="xs" c="dimmed">
              Your info is stored on your device only
            </Text>
          </Stack>
          <Quickname onDirtyChange={onDirtyChange} />
        </Stack>
        <GroupedList
          header={
            <Text size="sm" c="dimmed" fw={500} ml="md">
              About
            </Text>
          }
          footer={
            <Text size="xs" c="dimmed" ml="md">
              Made in the open by XMTP Labs
            </Text>
          }>
          <GroupedListItem href="https://xmtp.org/">
            <Text size="sm" flex={1}>
              Secured by XMTP
            </Text>
            <ExternalLinkIcon size={16} />
          </GroupedListItem>
          <GroupedListItem href="https://hq.convos.org/privacy-and-terms">
            <Text size="sm" flex={1}>
              Privacy &amp; Terms
            </Text>
            <ExternalLinkIcon size={16} />
          </GroupedListItem>
        </GroupedList>
        <LinkButton
          to="/delete-all"
          variant="filled"
          color="red"
          size="md"
          radius="md"
          disabled={!hasConvos}>
          Delete all data
        </LinkButton>
      </Stack>
    </Modal>
  );
};
