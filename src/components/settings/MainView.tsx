import { Group, Stack, Text } from "@mantine/core";
import {
  ChevronRightIcon,
  ClipboardIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { LinkButton } from "@/components/shared/Button";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useConvos } from "@/hooks/useConvos";

export const MainView: React.FC = () => {
  const convos = useConvos();
  const hasConvos = convos.length > 0;

  return (
    <Stack gap="md">
      <GroupedList
        footer={
          <Text size="xs" c="dimmed" ml="lg">
            Private unless you choose to share
          </Text>
        }>
        <GroupedListItem
          to="."
          search={(prev: Record<string, unknown>) => ({
            ...prev,
            view: "my-info",
          })}>
          <Group gap="xxxs" flex={1}>
            <ClipboardIcon size={16} />
            <Text size="sm">My info</Text>
          </Group>
          <ChevronRightIcon size={16} />
        </GroupedListItem>
      </GroupedList>
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
          <Text size="sm" c="dimmed" fw={500} ml="lg">
            About
          </Text>
        }
        footer={
          <Text size="xs" c="dimmed" ml="lg">
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
