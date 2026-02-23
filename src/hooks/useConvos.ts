import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";

export const useConvos = () => {
  return (
    useLiveQuery(
      () =>
        db.convos.toArray().then((convos) =>
          convos.sort((a, b) => {
            const aTime = a.lastUpdatedAtNs ?? 0n;
            const bTime = b.lastUpdatedAtNs ?? 0n;
            return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
          }),
        ),
      [],
    ) ?? []
  );
};
