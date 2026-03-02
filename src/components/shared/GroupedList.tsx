import { Anchor, Paper, Stack } from "@mantine/core";
import classes from "./GroupedList.module.css";

export const GroupedList: React.FC<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    footer?: React.ReactNode;
  }>
> = ({ header, footer, children }) => {
  return (
    <div className={classes.root}>
      {header}
      <Paper radius="md" bg="white" p={0}>
        <Stack gap={0}>{children}</Stack>
      </Paper>
      {footer}
    </div>
  );
};

export const GroupedListItem: React.FC<
  React.PropsWithChildren<{ href?: string }>
> = ({ href, children }) => {
  if (href) {
    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes.row}
        c="inherit"
        underline="never">
        {children}
      </Anchor>
    );
  }
  return <div className={classes.row}>{children}</div>;
};
