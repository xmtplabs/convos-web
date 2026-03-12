import { useLocalStorage } from "@mantine/hooks";

export const DEFAULT_QUICK_REACTION_EMOJI = "❤️";

export type ConvoDefaults = {
  inviteIncludesInfo: boolean;
  muted: boolean;
  blurImages: boolean;
  quickReactionEmoji: string;
};

const defaultConvoDefaults: ConvoDefaults = {
  inviteIncludesInfo: false,
  muted: false,
  blurImages: false,
  quickReactionEmoji: DEFAULT_QUICK_REACTION_EMOJI,
};

export const useConvoGlobalSettings = () => {
  const [stored, setStored] = useLocalStorage<ConvoDefaults>({
    key: "CONVOS_DEFAULT_PREFS",
    defaultValue: defaultConvoDefaults,
  });
  const merged = { ...defaultConvoDefaults, ...stored };
  return [merged, setStored] as const;
};
