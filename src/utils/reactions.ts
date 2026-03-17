import {
  isReaction,
  ReactionAction,
  type BuiltInContentTypes,
  type DecodedMessage,
  type Reaction,
} from "@xmtp/browser-sdk";

export type ReactionEntry = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type UserReaction = {
  inboxId: string;
  emojis: string[];
};

export type MessageReactions = {
  byEmoji: Map<string, ReactionEntry>;
  byUser: UserReaction[];
  totalCount: number;
};

// intermediate: emoji -> Set<inboxId>
type ReactionAccumulator = Map<string, Set<string>>;

export type ReactionMap = Map<string, MessageReactions>;

const addReactionToAccumulator = (
  acc: Map<string, ReactionAccumulator>,
  reference: string,
  reaction: Reaction,
  senderInboxId: string,
) => {
  if (!reaction.content) return;

  let msgAcc = acc.get(reference);
  if (!msgAcc) {
    msgAcc = new Map();
    acc.set(reference, msgAcc);
  }

  if (reaction.action === ReactionAction.Added) {
    let senders = msgAcc.get(reaction.content);
    if (!senders) {
      senders = new Set();
      msgAcc.set(reaction.content, senders);
    }
    senders.add(senderInboxId);
  } else if (reaction.action === ReactionAction.Removed) {
    const senders = msgAcc.get(reaction.content);
    if (senders) {
      senders.delete(senderInboxId);
      if (senders.size === 0) {
        msgAcc.delete(reaction.content);
      }
    }
  }
};

export const buildReactionMap = (
  messages: DecodedMessage<BuiltInContentTypes>[],
  inboxId: string,
): ReactionMap => {
  const acc = new Map<string, ReactionAccumulator>();

  for (const msg of messages) {
    if (!isReaction(msg) && msg.reactions.length > 0) {
      for (const r of msg.reactions) {
        const reaction = r.content as Reaction;
        if (reaction.reference) {
          addReactionToAccumulator(
            acc,
            reaction.reference,
            reaction,
            r.senderInboxId,
          );
        }
      }
    }
    if (isReaction(msg)) {
      const reaction = msg.content as Reaction;
      if (reaction.reference) {
        addReactionToAccumulator(
          acc,
          reaction.reference,
          reaction,
          msg.senderInboxId,
        );
      }
    }
  }

  const map: ReactionMap = new Map();

  for (const [messageId, msgAcc] of acc) {
    const byEmoji = new Map<string, ReactionEntry>();
    const userMap = new Map<string, string[]>();
    let totalCount = 0;

    for (const [emoji, senders] of msgAcc) {
      byEmoji.set(emoji, {
        emoji,
        count: senders.size,
        reacted: senders.has(inboxId),
      });
      totalCount += senders.size;

      for (const sender of senders) {
        let emojis = userMap.get(sender);
        if (!emojis) {
          emojis = [];
          userMap.set(sender, emojis);
        }
        emojis.push(emoji);
      }
    }

    const byUser: UserReaction[] = [];
    if (userMap.has(inboxId)) {
      byUser.push({ inboxId, emojis: userMap.get(inboxId) ?? [] });
      userMap.delete(inboxId);
    }
    for (const [uid, emojis] of userMap) {
      byUser.push({ inboxId: uid, emojis });
    }

    map.set(messageId, { byEmoji, byUser, totalCount });
  }

  return map;
};
