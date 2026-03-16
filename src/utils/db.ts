import type { Profile } from "@/db";
import { db, type Convo } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("db");

export const getConvo = (uuid: string) => {
  log.trace("getConvo", { uuid });
  return db.convos.get(uuid);
};

export const getConvos = () => {
  log.trace("getConvos");
  return db.convos.toArray();
};

export const addConvo = async (convo: Convo) => {
  log.trace("addConvo", { convo });
  return db.convos.add(convo);
};

export const updateConvo = (id: string, changes: Partial<Convo>) => {
  log.trace("updateConvo", { id, keys: Object.keys(changes) });
  return db.convos.update(id, changes);
};

export const deleteConvo = (uuid: string) => {
  log.trace("deleteConvo", { id: uuid });
  return db.convos.delete(uuid);
};

export const clearConvos = () => {
  log.info("clearConvos");
  return db.convos.clear();
};

export const findConvosBy = (filter: (convo: Convo) => boolean) => {
  log.trace("findConvosBy");
  return db.convos.filter(filter).toArray();
};

export const findConvoBy = (filter: (convo: Convo) => boolean) => {
  log.trace("findConvoBy");
  return db.convos.filter(filter).first();
};

export const getAvatar = async (convoId: string, inboxId: string) => {
  log.trace("getAvatar", { convoId, inboxId });
  return await db.avatars.get([convoId, inboxId]);
};

export const deleteAvatarsByConvoId = async (convoId: string) => {
  log.trace("deleteAvatarsByConvoId", { convoId });
  return db.avatars.where("convoId").equals(convoId).delete();
};

export const deleteAvatar = async (convoId: string, inboxId: string) => {
  log.trace("deleteAvatar", { convoId, inboxId });
  await db.avatars.delete([convoId, inboxId]);
};

export const addAvatar = async (
  convoId: string,
  inboxId: string,
  dataUrl: string,
  sourceUrl: string,
) => {
  log.trace("addAvatar", { convoId, inboxId, dataUrl, sourceUrl });
  await db.avatars.put({ convoId, inboxId, dataUrl, sourceUrl });
};

export const clearAvatars = async (convoId: string): Promise<void> => {
  log.trace("clearAvatars", { convoId });
  await db.avatars.where("convoId").equals(convoId).delete();
};

export const clearAllAvatars = async (): Promise<void> => {
  log.trace("clearAllAvatars");
  await db.avatars.clear();
};

export const getProfile = async () => {
  log.trace("getProfile");
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
