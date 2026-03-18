import { Box, Text } from "@mantine/core";
import type { BuiltInContentTypes, DecodedMessage } from "@xmtp/browser-sdk";
import classes from "./MessageList.module.css";

type FallbackContentProps = {
  message: DecodedMessage<BuiltInContentTypes>;
  isOwn: boolean;
};

export const FallbackContent: React.FC<FallbackContentProps> = ({
  message,
  isOwn,
}) => {
  const fallbackText = message.fallback || "This content can't be displayed";
  return (
    <Box
      className={`${classes.bubble} ${classes.bubbleUnsupported} ${isOwn ? classes.bubbleOwn : classes.bubbleOther}`}>
      <Text c="dimmed" fs="italic" size="sm">
        {fallbackText}
      </Text>
    </Box>
  );
};
