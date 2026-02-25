import { ActionIcon, Box, Group, Menu, Text } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import {
  CheckIcon,
  ListFilterIcon,
  SettingsIcon,
  SquarePenIcon,
} from "lucide-react";
import { LinkActionIcon } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import classes from "./AppHeader.module.css";

type Filter = "all" | "unread";

const ICON_SIZE = 14;

export const AppHeader = () => {
  const [filter, setFilter] = useLocalStorage<Filter>({
    key: "convos-filter",
    defaultValue: "all",
  });

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
          radius="xl"
          size="lg"
          to="."
          search={{ modal: "about" }}>
          <SettingsIcon size={24} />
        </LinkActionIcon>
        <Menu withArrow position="bottom">
          <Menu.Target>
            <ActionIcon radius="xl" size="lg" variant="transparent">
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
                setFilter("unread");
              }}>
              Unread
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <LinkActionIcon radius="xl" size="lg" to="/new">
          <SquarePenIcon size={24} />
        </LinkActionIcon>
      </Group>
    </Group>
  );
};
