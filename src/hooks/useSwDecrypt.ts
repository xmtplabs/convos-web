import { isGroupUpdated, isReaction } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import { type Convo } from "@/db";
import { useXmtpLock } from "@/hooks/useXmtpLock";
import { findConvoBy, updateConvo } from "@/utils/db";
import { createLogger } from "@/utils/log";
import { createClient, getContentString } from "@/utils/xmtp";

const log = createLogger("use-service-worker-decrypt");

export const useSwDecrypt = () => {
  const { acquireClient } = useXmtpLock();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (e: MessageEvent) => {
      const data = e.data as { type?: string } | null;
      if (!data || data.type !== "decrypt-message") return;

      const { messageId, xmtpId, payload } = data as {
        type: string;
        messageId: string;
        xmtpId: string;
        payload: { message?: string; shouldPush?: boolean };
      };

      void handleDecrypt(messageId, xmtpId, payload);
    };

    const handleDecrypt = async (
      reqId: string,
      xmtpId: string,
      payload: { message?: string; shouldPush?: boolean },
    ) => {
      const reply = (result: { title: string; body: string } | "skip") => {
        navigator.serviceWorker.controller?.postMessage({
          type: "decrypt-result",
          messageId: reqId,
          ...(result === "skip"
            ? { skip: true }
            : { title: result.title, body: result.body }),
        });
      };

      try {
        const convo = await findConvoBy((c) => c.xmtpId === xmtpId);
        if (!convo) {
          log.warn("convo not found", { xmtpId });
          return;
        }

        const convoName = convo.name || "Convo";

        if (!payload.message) {
          log.warn("no message in payload");
          reply("skip");
          return;
        }

        const envelopeBytes = Uint8Array.from(atob(payload.message), (c) =>
          c.charCodeAt(0),
        );

        // use a temporary client — acquireClient would evict the
        // active convo's lock holder, so we build a disposable one
        log.debug("building temp client", { xmtpId });
        const tempClient = await createClient(convo.privateKey);
        try {
          const conversation =
            await tempClient.conversations.getConversationById(xmtpId);
          if (!conversation) {
            log.warn("conversation not found", { xmtpId });
            reply("skip");
            return;
          }

          const processed =
            await conversation.processStreamedMessage(envelopeBytes);
          if (processed.length === 0) {
            reply("skip");
            return;
          }

          const decoded = await tempClient.conversations.getMessageById(
            processed[0].id,
          );
          if (!decoded) {
            reply("skip");
            return;
          }

          const isSelf = decoded.senderInboxId === tempClient.inboxId;

          const dbUpdates: Partial<Convo> = {
            lastUpdatedAtNs: decoded.sentAtNs,
            unread: !isSelf,
          };

          if (isGroupUpdated(decoded) && decoded.content) {
            const nameChange = decoded.content.metadataFieldChanges.find(
              (c) => c.fieldName === "group_name" && c.newValue,
            );
            if (nameChange) {
              dbUpdates.name = nameChange.newValue;
              dbUpdates.lastMessage = convo.lastMessage;
              if (!isSelf) {
                const oldName = nameChange.oldValue || convoName;
                reply({
                  title: oldName,
                  body: `The group name was changed to "${nameChange.newValue}"`,
                });
              } else {
                reply("skip");
              }
            } else {
              dbUpdates.lastMessage = convo.lastMessage;
              reply("skip");
            }
          } else {
            const content = getContentString(decoded);
            dbUpdates.lastMessage = content ?? convo.lastMessage;
            if (
              !isSelf &&
              content &&
              (payload.shouldPush || isReaction(decoded))
            ) {
              reply({ title: convoName, body: content });
            } else {
              reply("skip");
            }
          }

          void updateConvo(convo.id, dbUpdates);
        } finally {
          tempClient.close();
        }
      } catch (err) {
        log.error("failed", err);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [acquireClient]);
};
