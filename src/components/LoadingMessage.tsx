import { Loader, LoadingOverlay, Stack, Text } from "@mantine/core";
import classes from "./LoadingMessage.module.css";

export type LoadingMessageProps = {
  message: string;
};

export const LoadingMessage: React.FC<LoadingMessageProps> = ({ message }) => {
  return (
    <LoadingOverlay
      visible={true}
      loaderProps={{
        children: (
          <Stack
            className={classes.root}
            gap="xs"
            justify="center"
            align="center"
            bg="black"
            p="xl">
            <Loader color="white" />
            <Text c="white">{message}</Text>
          </Stack>
        ),
      }}
    />
  );
};
