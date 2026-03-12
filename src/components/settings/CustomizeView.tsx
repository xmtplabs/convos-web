import { ActionIcon, Stack, Switch, Text } from "@mantine/core";
import { BellIcon, EyeIcon, InfoIcon, SmilePlusIcon } from "lucide-react";
import { useState } from "react";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useConvoGlobalSettings } from "@/hooks/useConvoGlobalSettings";
import { createLogger } from "@/utils/log";

const log = createLogger("settings");

export const CustomizeView: React.FC = () => {
  const [defaults, setDefaults] = useConvoGlobalSettings();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Stack gap="md">
      <Text>These preferences will apply to all new convos.</Text>
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
              Pic, name &amp; desc
            </Text>
          </Stack>
          <Switch
            withThumbIndicator={false}
            checked={defaults.inviteIncludesInfo}
            onChange={(e) => {
              log.info("default inviteIncludesInfo toggled", {
                value: e.currentTarget.checked,
              });
              setDefaults({
                ...defaults,
                inviteIncludesInfo: e.currentTarget.checked,
              });
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
            checked={!defaults.muted}
            onChange={(e) => {
              log.info("default muted toggled", {
                value: !e.currentTarget.checked,
              });
              setDefaults({
                ...defaults,
                muted: !e.currentTarget.checked,
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
            checked={defaults.blurImages}
            onChange={(e) => {
              log.info("default blurImages toggled", {
                value: e.currentTarget.checked,
              });
              setDefaults({
                ...defaults,
                blurImages: e.currentTarget.checked,
              });
            }}
          />
        </GroupedListItem>
        <GroupedListItem>
          <SmilePlusIcon size={28} strokeWidth={1.5} />
          <Stack gap={0} flex={1} style={{ overflow: "hidden" }}>
            <Text size="sm">Quick reaction</Text>
            <Text size="xs" c="dimmed">
              Double-tap to react
            </Text>
          </Stack>
          <EmojiPicker
            opened={pickerOpen}
            onClose={() => {
              setPickerOpen(false);
            }}
            onSelect={(emoji) => {
              log.info("default quickReactionEmoji changed", { emoji });
              setDefaults({ ...defaults, quickReactionEmoji: emoji });
            }}>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => {
                setPickerOpen((o) => !o);
              }}>
              <Text size="lg">{defaults.quickReactionEmoji}</Text>
            </ActionIcon>
          </EmojiPicker>
        </GroupedListItem>
      </GroupedList>
    </Stack>
  );
};
