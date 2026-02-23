import { db, type Profile } from "@/db";

export const getProfile = () => db.profiles.toCollection().first();
export const upsertProfile = (profile: Profile) => db.profiles.put(profile);
export const clearProfiles = () => db.profiles.clear();
