import { db, type Convo } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("db");

export const getConvo = (uuid: string) => {
  log.trace("getConvo", { uuid });
  return db.convos.get(uuid);
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
