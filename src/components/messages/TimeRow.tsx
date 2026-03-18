import { Group, Text } from "@mantine/core";
import type { TimeRow as TimeRowData } from "@/utils/messageRows";
import classes from "./MessageList.module.css";

export type TimeRowProps = {
  row: TimeRowData;
};

export const TimeRow: React.FC<TimeRowProps> = ({ row }) => (
  <Group justify="center" className={classes.item} pt="md" pb="xxs">
    <Text size="xs" c="dimmed">
      {row.label}
    </Text>
  </Group>
);
