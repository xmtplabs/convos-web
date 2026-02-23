import { Group, Modal, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { ExternalLinkButton, LinkButton } from "@/components/Button";
import { Quickname } from "@/components/Quickname";
import { useConvos } from "@/hooks/useConvos";

export const AboutModal = () => {
  const navigate = useNavigate();
  const convos = useConvos();
  const hasConvos = convos.length > 0;
  const dirtyRef = useRef(false);

  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const onClose = () => {
    if (dirtyRef.current) {
      return;
    }
    void navigate({ to: ".", search: { modal: undefined } });
  };

  return (
    <Modal
      radius="lg"
      opened
      onClose={onClose}
      withCloseButton={false}
      title="Convos"
      styles={{
        title: { fontSize: "var(--mantine-h2-font-size)", fontWeight: 700 },
      }}
      centered>
      <Stack gap="md">
        <Text>Private chat for the AI world</Text>
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
        <Stack gap="xxs">
          <Title order={3}>About</Title>
          <ExternalLinkButton
            href="https://xmtp.org/"
            justify="space-between"
            variant="filled"
            size="md"
            radius="xl"
            leftSection={<span />}
            rightSection={<ExternalLinkIcon size={20} />}>
            Secured by XMTP
          </ExternalLinkButton>
          <ExternalLinkButton
            href="https://hq.convos.org/privacy-and-terms"
            justify="space-between"
            size="md"
            radius="xl"
            variant="filled"
            leftSection={<span />}
            rightSection={<ExternalLinkIcon size={20} />}>
            Privacy &amp; Terms
          </ExternalLinkButton>
          <Group justify="space-between" px="sm">
            <Text size="xs" c="dimmed">
              Made in the open by XMTP Labs
            </Text>
            <Text size="xs" c="dimmed">
              v0.1.0
            </Text>
          </Group>
        </Stack>
        <LinkButton
          to="/delete-all"
          variant="light"
          color="red"
          size="md"
          radius="xl"
          disabled={!hasConvos}>
          Delete all app data
        </LinkButton>
      </Stack>
    </Modal>
  );
};
