import { ActionIcon, Group, Text } from "@mantine/core";
import { SettingsIcon, SquarePenIcon, XIcon } from "lucide-react";
import { FilterMenu } from "@/components/convos/FilterMenu";
import { LinkActionIcon } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { useNav } from "@/contexts/NavContext";
import { useConvosFilter } from "@/hooks/useConvosFilter";
import classes from "./AppHeader.module.css";

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
        <FilterMenu filter={filter} setFilter={setFilter} />
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
