import { Stack, Text, Title } from "@mantine/core";
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import { Quickname } from "@/components/app/Quickname";
import { LinkButton } from "@/components/shared/Button";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useConvos } from "@/hooks/useConvos";

export const MainView: React.FC<{
  onDirtyChange: (dirty: boolean) => void;
}> = ({ onDirtyChange }) => {
  const convos = useConvos();
  const hasConvos = convos.length > 0;

  return (
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
      <GroupedList>
        <GroupedListItem
          to="."
          search={(prev: Record<string, unknown>) => ({
            ...prev,
            view: "customize",
          })}>
          <Text size="sm" flex={1}>
            Customize
          </Text>
          <ChevronRightIcon size={16} />
        </GroupedListItem>
      </GroupedList>
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
        to="."
        search={(prev) => ({ ...prev, modal: "delete-all" })}
        variant="filled"
        color="red"
        size="lg"
        radius="lg"
        disabled={!hasConvos}>
        Delete all data
      </LinkButton>
    </Stack>
  );
};
