import { Group, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { GroupedListItem } from "@/components/shared/GroupedList";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";

export const ConvoInfoModal: React.FC = () => {
  const navigate = useNavigate();

  const onClose = () => {
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, modal: undefined }),
    });
  };

  return (
    <Modal
      onClose={onClose}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="sm">
      <Stack gap="lg">
        <Stack gap="sm" pt="lg">
          <Text size="xs">Real life is off the record.&trade;</Text>
          <Text size="xxl" fw="bold">
            New convo,
            <br />
            new everything
          </Text>
          <Text>
            Every convo gives you a fresh cryptographic identity. No one can
            link your conversations together.
          </Text>
          <Text size="sm">
            New members can&apos;t see earlier messages, and leaving a convo destroys
            your identity in it.
          </Text>
        </Stack>

        <Stack gap="xxxs">
          <ModalCloseButton variant="filled">Got it</ModalCloseButton>
          <GroupedListItem href="https://example.com">
            <Stack align="center" flex={1}>
              <Group gap="xs" align="center">
                <Text size="sm">Learn more</Text>
                <ExternalLinkIcon size={16} />
              </Group>
            </Stack>
          </GroupedListItem>
        </Stack>
      </Stack>
    </Modal>
  );
};
