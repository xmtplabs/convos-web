import { Box, Group, Skeleton, Stack } from "@mantine/core";
import { ConvoCard } from "@/components/convos/ConvoCard";
import type { Convo } from "@/db";
import classes from "./MessagesSkeleton.module.css";

type Row =
  | { align: "left" | "right"; lines: number[] }
  | { align: "center"; width: number };

const ROWS: Row[] = [
  { align: "left", lines: [180, 120] },
  { align: "right", lines: [200] },
  { align: "left", lines: [240, 160, 100] },
  { align: "center", width: 160 },
  { align: "right", lines: [180, 140] },
  { align: "left", lines: [140] },
  { align: "right", lines: [260, 200, 120] },
  { align: "left", lines: [200, 160] },
];

type MessagesSkeletonProps = {
  convo?: Convo;
};

export const MessagesSkeleton: React.FC<MessagesSkeletonProps> = ({
  convo,
}) => {
  return (
    <div className={classes.root}>
      {convo && (
        <Box px="lg" pt="lg">
          <ConvoCard convo={convo} />
        </Box>
      )}
      <div className={classes.messages}>
        {ROWS.map((row, i) =>
          row.align === "center" ? (
            <Group key={i} justify="center">
              <Skeleton height={12} width={row.width} radius="xl" />
            </Group>
          ) : (
            <Group
              key={i}
              justify={row.align === "right" ? "flex-end" : "flex-start"}>
              <Stack
                gap={4}
                align={row.align === "right" ? "flex-end" : "flex-start"}>
                {row.lines.map((width, j) => (
                  <Skeleton key={j} height={12} width={width} radius="xl" />
                ))}
              </Stack>
            </Group>
          ),
        )}
      </div>
    </div>
  );
};
