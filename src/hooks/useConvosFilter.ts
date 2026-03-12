import { useLocalStorage } from "@mantine/hooks";
import { useMemo } from "react";
import type { Convo } from "@/db";

export type Filter = "all" | "unread" | "muted" | "exploding";

export const useConvosFilter = () =>
  useLocalStorage<Filter>({
    key: "CONVOS_CONVO_FILTER",
    defaultValue: "all",
  });

export const useFilteredConvos = (convos: Convo[]) => {
  const [filter] = useConvosFilter();

  return useMemo(() => {
    if (filter === "unread") {
      return convos.filter((c) => c.unread);
    }
    if (filter === "muted") {
      return convos.filter((c) => c.muted);
    }
    if (filter === "exploding") {
      return convos.filter((c) => c.expiresAtUnix != null);
    }
    return convos;
  }, [convos, filter]);
};
