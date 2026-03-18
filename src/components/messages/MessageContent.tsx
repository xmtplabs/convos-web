import {
  isRemoteAttachment,
  type BuiltInContentTypes,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { FallbackContent } from "./FallbackContent";
import { RemoteAttachmentContent } from "./RemoteAttachmentContent";
import { TextContent } from "./TextContent";

type MessageContentProps = {
  message: DecodedMessage<BuiltInContentTypes>;
  content: string;
  isOwn: boolean;
  onScrollToMessage: (messageId: string) => void;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  content,
  isOwn,
  onScrollToMessage,
}) => {
  if (message.content === undefined) {
    return <FallbackContent message={message} isOwn={isOwn} />;
  }
  if (isRemoteAttachment(message)) {
    return <RemoteAttachmentContent content={message.content} isOwn={isOwn} />;
  }
  return (
    <TextContent
      message={message}
      content={content}
      isOwn={isOwn}
      onScrollToMessage={onScrollToMessage}
    />
  );
};
