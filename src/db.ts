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
  xmtpId?: string;
  tag?: string;
  status?: "pending" | "creating" | "ready" | "error";
  creatorInboxId?: string;
  slug?: string;
  faved?: boolean;
  locked?: boolean;
  expiresAtUnix?: number;
  blurImages?: boolean;
  muted?: boolean;
  inviteIncludesInfo?: boolean;
  quickReactionEmoji?: string;
  unread?: boolean;
};

export type ReadyConvo = Convo & { xmtpId: string; status: "ready" };

export const isReadyConvo = (c: Convo): c is ReadyConvo =>
  c.status === "ready" && !!c.xmtpId;

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

db.version(2)
  .stores({
    convos: "id",
    profiles: "id",
    avatars: "[convoId+inboxId], convoId",
  })
  .upgrade((tx) => {
    return tx
      .table("convos")
      .toCollection()
      .modify((convo: Convo) => {
        if (!convo.status) {
          convo.status = "ready";
        }
      });
  });

log.trace("database initialized");

export { db };
