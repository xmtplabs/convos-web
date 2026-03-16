import { useLiveQuery } from "dexie-react-hooks";
import { getConvos } from "@/utils/db";

export const useConvos = () => {
  return (
    useLiveQuery(
      () =>
        getConvos().then((convos) =>
          convos.sort((a, b) => {
            const aFaved = a.faved ? 1 : 0;
            const bFaved = b.faved ? 1 : 0;
            if (aFaved !== bFaved) return bFaved - aFaved;
            const aTime = a.lastUpdatedAtNs ?? 0n;
            const bTime = b.lastUpdatedAtNs ?? 0n;
            return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
          }),
        ),
      [],
    ) ?? []
  );
};
