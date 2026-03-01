import { db, type Profile } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("db");

export const getProfile = () => {
  log.debug("getProfile");
  return db.profiles.toCollection().first();
};

export const upsertProfile = (profile: Profile) => {
  log.info("upsertProfile", { id: profile.id });
  return db.profiles.put(profile);
};

export const clearProfiles = () => {
  log.info("clearProfiles");
  return db.profiles.clear();
};
