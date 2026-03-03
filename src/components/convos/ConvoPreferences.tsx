import { Stack, Switch, Text } from "@mantine/core";
import { EyeIcon } from "lucide-react";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-details");

export const ConvoPreferences: React.FC = () => {
  const { convo } = useConvo();

  return (
    <GroupedList
      header={
        <Text size="sm" c="dimmed" fw={500} ml="lg">
          Preferences
        </Text>
      }>
      <GroupedListItem>
        <EyeIcon size={28} strokeWidth={1.5} />
        <Stack gap={0} flex={1} style={{ overflow: "hidden" }}>
          <Text size="sm">Reveal mode</Text>
          <Text size="xs" c="dimmed">
            Blur incoming pics
          </Text>
        </Stack>
        <Switch
          withThumbIndicator={false}
          checked={!!convo.blurImages}
          onChange={() => {
            log.info("blur images toggled", {
              convoId: convo.id,
              blurImages: !convo.blurImages,
            });
            void updateConvo(convo.id, {
              blurImages: !convo.blurImages,
            });
          }}
        />
      </GroupedListItem>
    </GroupedList>
  );
};
