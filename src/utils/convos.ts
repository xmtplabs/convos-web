import { db, type Convo } from "@/db";

export const getConvo = (uuid: string) => db.convos.get(uuid);
export const updateConvo = (id: string, changes: Partial<Convo>) =>
  db.convos.update(id, changes);
export const deleteConvo = (uuid: string) => db.convos.delete(uuid);
export const clearConvos = () => db.convos.clear();
