import { useLiveQuery } from "dexie-react-hooks";
import { getProfile } from "@/utils/db";

export const useProfile = () => {
  return useLiveQuery(() => getProfile()) ?? null;
};
