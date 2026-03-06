import { ActionIcon, Box, Group, Menu, Text } from "@mantine/core";
import {
  CheckIcon,
  ListFilterIcon,
  MenuIcon,
  SettingsIcon,
  SquarePenIcon,
} from "lucide-react";
import { useConvosFilter } from "@/components/convos/ConvosList";
import { LinkActionIcon } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { useNav } from "@/contexts/NavContext";
import { createLogger } from "@/utils/log";
import classes from "./AppHeader.module.css";

const log = createLogger("app-header");

const ICON_SIZE = 14;

export const AppHeader = () => {
  const { openNav } = useNav();
  const [filter, setFilter] = useConvosFilter();

  return (
    <Group
      gap="xs"
      px="md"
      align="center"
      justify="space-between"
      className={classes.root}>
      <Group gap="xxxs" align="center" wrap="nowrap">
        <ActionIcon variant="transparent" onClick={openNav} hiddenFrom="sm">
          <MenuIcon size={24} />
        </ActionIcon>
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
          search={{ modal: "about" }}>
          <SettingsIcon size={24} />
        </LinkActionIcon>
        <Menu withArrow position="bottom">
          <Menu.Target>
            <ActionIcon
              radius="xl"
              size="lg"
              variant="transparent"
              visibleFrom="sm">
              <ListFilterIcon size={24} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
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
            </Menu.Item>
            <Menu.Item
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
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <LinkActionIcon radius="xl" size="lg" to="/new" variant="transparent">
          <SquarePenIcon size={24} />
        </LinkActionIcon>
      </Group>
    </Group>
  );
};
