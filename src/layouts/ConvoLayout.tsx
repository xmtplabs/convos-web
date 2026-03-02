import { Box, Group, LoadingOverlay, ScrollArea, Stack } from "@mantine/core";
import classes from "./ConvoLayout.module.css";

export type ConvoLayoutProps = React.PropsWithChildren<{
  header: React.ReactNode;
  footer: React.ReactNode;
  loading?: boolean;
  withScrollArea?: boolean;
  detailsOpen?: boolean;
  className?: string;
}>;

export const ConvoLayout: React.FC<ConvoLayoutProps> = ({
  children,
  header,
  footer,
  loading = false,
  withScrollArea = true,
  detailsOpen = false,
  className,
}) => {
  const rootClassNames = [classes.root, className].filter(Boolean);
  const contentClassNames = [
    classes.content,
    !footer && classes.noFooter,
    className,
  ].filter(Boolean);
  return (
    <Stack
      className={rootClassNames.join(" ")}
      gap={0}
      data-details={detailsOpen ? "opened" : undefined}>
      <LoadingOverlay visible={loading} />
      <Group align="center" wrap="nowrap" className={classes.header}>
        {header}
      </Group>
      <Box className={contentClassNames.join(" ")}>
        {withScrollArea ? (
          <ScrollArea type="scroll" className={classes.scrollArea} px="md">
            <Box>{children}</Box>
          </ScrollArea>
        ) : (
          children
        )}
      </Box>
      <Box className={classes.footer}>{footer}</Box>
    </Stack>
  );
};
