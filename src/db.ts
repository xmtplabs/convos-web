import Dexie, { type EntityTable, type Table } from "dexie";
import { createLogger } from "@/utils/log";

const log = createLogger("db");

export type Convo = {
  description?: string;
  id: string;
  imageUrl?: string;
  lastMessage?: string;
  lastUpdatedAtNs?: bigint;
  name?: string;
  privateKey: `0x${string}`;
  xmtpId: string;
  tag?: string;
  status?: "pending";
  creatorInboxId?: string;
  slug?: string;
  faved?: boolean;
  locked?: boolean;
  expiresAtUnix?: number;
  blurImages?: boolean;
};

export type Profile = {
  id: string;
  name?: string;
  avatarUrl?: string;
  avatarSalt?: string;
  avatarNonce?: string;
  avatarKey?: string;
};

export type CachedAvatar = {
  convoId: string;
  inboxId: string;
  dataUrl: string; // "data:image/...;base64,..."
  sourceUrl: string; // for staleness detection
};

export type ConvosDb = Dexie & {
  convos: EntityTable<Convo, "id">;
  profiles: EntityTable<Profile, "id">;
  avatars: Table<CachedAvatar, [string, string]>;
};

const db = new Dexie("convos-web") as ConvosDb;

db.version(1).stores({
  convos: "id",
  profiles: "id",
  avatars: "[convoId+inboxId], convoId",
});

log.trace("database initialized");

export { db };
