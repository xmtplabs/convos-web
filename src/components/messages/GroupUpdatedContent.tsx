import { Stack, Text } from "@mantine/core";
import type {
  BuiltInContentTypes,
  DecodedMessage,
  GroupUpdated,
} from "@xmtp/browser-sdk";
import type { ResolvedConvo } from "@/contexts/ConvoContext";
import { useConvo } from "@/hooks/useConvo";
import { getGroupUpdatedStrings } from "@/utils/xmtp";
import { ExplodeNotification } from "./ExplodeNotification";
import classes from "./MessageList.module.css";

type GroupUpdatedContentProps = {
  message: DecodedMessage<BuiltInContentTypes>;
  groupUpdated: GroupUpdated;
  convo: ResolvedConvo;
};

export const GroupUpdatedContent: React.FC<GroupUpdatedContentProps> = ({
  message,
  groupUpdated,
  convo,
}) => {
  const { memberProfiles } = useConvo();
  const initiatorName = memberProfiles.get(
    groupUpdated.initiatedByInboxId,
  )?.name;
  const lines = getGroupUpdatedStrings(
    groupUpdated,
    initiatorName,
    memberProfiles,
  );
  const hasUnrecognized =
    groupUpdated.metadataFieldChanges.length > lines.length;

  return (
    <>
      {lines.length > 0 && (
        <Stack gap={0} align="center" className={classes.item}>
          {lines.map((line) => (
            <Text key={line} size="xs" c="dimmed">
              {line}
            </Text>
          ))}
        </Stack>
      )}
      {hasUnrecognized && convo.expiresAtUnix != null && (
        <ExplodeNotification
          initiatorInboxId={groupUpdated.initiatedByInboxId}
          sentAtNs={message.sentAtNs}
          expiresAtUnix={convo.expiresAtUnix}
        />
      )}
    </>
  );
};
