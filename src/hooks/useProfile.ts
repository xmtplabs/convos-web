import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";

export const useProfile = () => {
  return useLiveQuery(() => db.profiles.toCollection().first()) ?? null;
};
