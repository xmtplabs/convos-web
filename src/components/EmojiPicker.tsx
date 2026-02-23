import { Popover, useMantineColorScheme } from "@mantine/core";
import EmojiPickerReact, { Theme } from "emoji-picker-react";

export const EmojiPicker: React.FC<{
  opened: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  children: React.ReactNode;
}> = ({ opened, onClose, onSelect, children }) => {
  const { colorScheme } = useMantineColorScheme();
  const theme = colorScheme === "dark" ? Theme.DARK : Theme.LIGHT;

  return (
    <Popover
      opened={opened}
      onChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      position="top"
      withArrow
      shadow="md">
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown p={0} style={{ border: "none", background: "none" }}>
        <EmojiPickerReact
          theme={theme}
          searchPlaceholder="Search emoji..."
          skinTonesDisabled
          onEmojiClick={(emojiData) => {
            onSelect(emojiData.emoji);
            onClose();
          }}
          height={350}
          width={300}
        />
      </Popover.Dropdown>
    </Popover>
  );
};
