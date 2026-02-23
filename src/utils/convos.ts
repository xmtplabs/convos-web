import { db, type Convo } from "@/db";

export const getConvo = (uuid: string) => db.convos.get(uuid);
export const updateConvo = (convo: Convo) => db.convos.put(convo);
export const deleteConvo = (uuid: string) => db.convos.delete(uuid);
export const clearConvos = () => db.convos.clear();
