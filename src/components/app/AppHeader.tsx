import { ActionIcon, Box, Group, Text } from "@mantine/core";
import {
  CheckIcon,
  ListFilterIcon,
  SettingsIcon,
  SquarePenIcon,
  XIcon,
} from "lucide-react";
import { useConvosFilter } from "@/components/convos/ConvosList";
import { ActionSheet } from "@/components/shared/ActionSheet";
import { LinkActionIcon } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { useNav } from "@/contexts/NavContext";
import { createLogger } from "@/utils/log";
import classes from "./AppHeader.module.css";

const log = createLogger("app-header");

const ICON_SIZE = 14;

export const AppHeader = () => {
  const { closeNav } = useNav();
  const [filter, setFilter] = useConvosFilter();

  return (
    <Group
      gap="xs"
      px="md"
      align="center"
      justify="space-between"
      className={classes.root}>
      <Group gap="xxxs" align="center" wrap="nowrap">
        <Logo size={36} />
        <Text fw="bold" size="xl">
          Convos
        </Text>
      </Group>
      <Group gap="xxxs" align="center" p="0">
        <LinkActionIcon
          variant="transparent"
          radius="xl"
          size="lg"
          to="."
          search={{ panel: "settings" }}>
          <SettingsIcon size={24} />
        </LinkActionIcon>
        <ActionSheet withArrow position="bottom">
          <ActionSheet.Target>
            <ActionIcon radius="xl" size="lg" variant="transparent">
              <ListFilterIcon size={24} />
            </ActionIcon>
          </ActionSheet.Target>
          <ActionSheet.Dropdown>
            <ActionSheet.Item
              leftSection={
                filter === "all" ? (
                  <CheckIcon size={ICON_SIZE} />
                ) : (
                  <Box w={ICON_SIZE} />
                )
              }
              onClick={() => {
                log.info("filter changed", { filter: "all" });
                setFilter("all");
              }}>
              All
            </ActionSheet.Item>
            <ActionSheet.Item
              leftSection={
                filter === "unread" ? (
                  <CheckIcon size={ICON_SIZE} />
                ) : (
                  <Box w={ICON_SIZE} />
                )
              }
              onClick={() => {
                log.info("filter changed", { filter: "unread" });
                setFilter("unread");
              }}>
              Unread
            </ActionSheet.Item>
            <ActionSheet.Item
              leftSection={
                filter === "muted" ? (
                  <CheckIcon size={ICON_SIZE} />
                ) : (
                  <Box w={ICON_SIZE} />
                )
              }
              onClick={() => {
                log.info("filter changed", { filter: "muted" });
                setFilter("muted");
              }}>
              Muted
            </ActionSheet.Item>
          </ActionSheet.Dropdown>
        </ActionSheet>
        <LinkActionIcon radius="xl" size="lg" to="/new" variant="transparent">
          <SquarePenIcon size={24} />
        </LinkActionIcon>
        <ActionIcon
          variant="transparent"
          radius="xl"
          size="lg"
          onClick={closeNav}
          hiddenFrom="sm">
          <XIcon size={24} />
        </ActionIcon>
      </Group>
    </Group>
  );
};
