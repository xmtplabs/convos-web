import { ActionIcon, Box } from "@mantine/core";
import { CheckIcon, ListFilterIcon } from "lucide-react";
import { ActionSheet } from "@/components/shared/ActionSheet";
import type { Filter } from "@/hooks/useConvosFilter";
import { createLogger } from "@/utils/log";

const log = createLogger("filter-menu");

const ICON_SIZE = 14;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "muted", label: "Muted" },
  { value: "exploding", label: "Exploding" },
];

export const FilterMenu: React.FC<{
  filter: Filter;
  setFilter: (filter: Filter) => void;
}> = ({ filter, setFilter }) => (
  <ActionSheet withArrow position="bottom">
    <ActionSheet.Target>
      <ActionIcon
        radius="xl"
        size="lg"
        variant={filter !== "all" ? "filled" : "transparent"}
        color={filter !== "all" ? "dark" : undefined}>
        <ListFilterIcon size={24} />
      </ActionIcon>
    </ActionSheet.Target>
    <ActionSheet.Dropdown>
      {filters.map((f) => (
        <ActionSheet.Item
          key={f.value}
          leftSection={
            filter === f.value ? (
              <CheckIcon size={ICON_SIZE} />
            ) : (
              <Box w={ICON_SIZE} />
            )
          }
          onClick={() => {
            log.info("filter changed", { filter: f.value });
            setFilter(f.value);
          }}>
          {f.label}
        </ActionSheet.Item>
      ))}
    </ActionSheet.Dropdown>
  </ActionSheet>
);
