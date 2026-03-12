import { Stack, Switch, Text } from "@mantine/core";
import { BellIcon, EyeIcon, InfoIcon } from "lucide-react";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-details");

export const ConvoPreferences: React.FC = () => {
  const { convo } = useConvo();
  const inviteIncludesInfo = convo.inviteIncludesInfo ?? false;

  return (
    <GroupedList
      header={
        <Text size="sm" c="dimmed" fw={500} ml="lg">
          Preferences
        </Text>
      }>
      <GroupedListItem>
        <InfoIcon size={28} strokeWidth={1.5} />
        <Stack gap={0} flex={1} style={{ overflow: "hidden" }}>
          <Text size="sm">Invites include info</Text>
          <Text size="xs" c="dimmed">
            Pic, name & desc
          </Text>
        </Stack>
        <Switch
          withThumbIndicator={false}
          checked={inviteIncludesInfo}
          onChange={(e) => {
            const val = e.currentTarget.checked;
            log.info("include info toggled", {
              inviteIncludesInfo: val,
            });
            void updateConvo(convo.id, { inviteIncludesInfo: val });
          }}
        />
      </GroupedListItem>
      <GroupedListItem>
        <BellIcon size={28} strokeWidth={1.5} />
        <Stack gap={0} flex={1} style={{ overflow: "hidden" }}>
          <Text size="sm">Notifications</Text>
        </Stack>
        <Switch
          withThumbIndicator={false}
          checked={!convo.muted}
          onChange={() => {
            log.info(convo.muted ? "unmute" : "mute", {
              convoId: convo.id,
              muted: !convo.muted,
            });
            void updateConvo(convo.id, {
              muted: !convo.muted,
            });
          }}
        />
      </GroupedListItem>
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
