import { useLocalStorage } from "@mantine/hooks";

export type ConvoDefaults = {
  inviteIncludesInfo: boolean;
  muted: boolean;
  blurImages: boolean;
};

const defaultConvoDefaults: ConvoDefaults = {
  inviteIncludesInfo: false,
  muted: false,
  blurImages: false,
};

export const useConvoDefaults = () =>
  useLocalStorage<ConvoDefaults>({
    key: "CONVOS_DEFAULT_PREFS",
    defaultValue: defaultConvoDefaults,
  });
