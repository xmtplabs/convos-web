import {
  ConsentState,
  Group,
  isGroupUpdated,
  isReaction,
  type AsyncStreamProxy,
  type BuiltInContentTypes,
  type Client,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { generatePrivateKey } from "viem/accounts";
import { db, type Convo } from "@/db";
import { decodeAppData, initGroupAppData } from "@/utils/appData";
import { updateConvo } from "@/utils/convos";
import { processDmInvite, processExistingDms } from "@/utils/invite";
import { createLogger } from "@/utils/log";
import { registerConvo } from "@/utils/notifications";
import { createClient, getContentString } from "@/utils/xmtp";

const log = createLogger("xmtp");

function postActiveConvo(xmtpId: string | null) {
  navigator.serviceWorker.controller?.postMessage({
    type: "active-convo",
    xmtpId,
  });
}

type XmtpState =
  | { status: "idle"; client: null; conversation: null }
  | { status: "loading"; client: null; conversation: null }
  | { status: "connected"; client: Client; conversation: null }
  | {
      status: "ready";
      client: Client;
      conversation: Conversation<BuiltInContentTypes>;
    };

const idleState: XmtpState = {
  status: "idle",
  client: null,
  conversation: null,
};
const loadingState: XmtpState = {
  status: "loading",
  client: null,
  conversation: null,
};

export type XmtpContextValue = XmtpState & {
  setConvo: (convo: Convo | null) => void;
  createConvo: () => Promise<Convo>;
};

export const XmtpContext = createContext<XmtpContextValue | null>(null);

export const XmtpProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  log.trace("render");
  const [state, setState] = useState<XmtpState>(idleState);
  const clientRef = useRef<Client | null>(null);
  const convoIdRef = useRef<string | null>(null);
  const setupRef = useRef<Promise<void>>(Promise.resolve());
  const cancelRef = useRef<(() => void) | null>(null);
  const dmStreamRef = useRef<AsyncStreamProxy<
    DecodedMessage<BuiltInContentTypes>
  > | null>(null);
  const groupStreamRef = useRef<AsyncStreamProxy<Group> | null>(null);

  const setConvo = useCallback((convo: Convo | null) => {
    log.trace("setConvo", { convoId: convo?.id ?? null });
    if (convo?.id === convoIdRef.current) {
      log.debug("setConvo skipped, same convo");
      return;
    }

    // cancel any in-flight setup
    cancelRef.current?.();
    cancelRef.current = null;

    if (!convo) {
      if (groupStreamRef.current) {
        void groupStreamRef.current.end();
        groupStreamRef.current = null;
      }
      if (dmStreamRef.current) {
        void dmStreamRef.current.end();
        dmStreamRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
      convoIdRef.current = null;
      setupRef.current = Promise.resolve();
      postActiveConvo(null);
      setState(idleState);
      log.info("disconnected");
      return;
    }

    convoIdRef.current = convo.id;
    void updateConvo(convo.id, { unread: false });

    setState(loadingState);

    let cancelled = false;
    cancelRef.current = () => {
      cancelled = true;
    };

    // wait for previous setup to finish before starting a new one
    const prevSetup = setupRef.current;
    setupRef.current = (async () => {
      await prevSetup.catch(() => {});

      // close previous streams and client after setup has settled
      if (groupStreamRef.current) {
        void groupStreamRef.current.end();
        groupStreamRef.current = null;
      }
      if (dmStreamRef.current) {
        void dmStreamRef.current.end();
        dmStreamRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) {
        return;
      }

      log.trace("setup: building client", { convoId: convo.id });
      const newClient = await createClient(convo.privateKey);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) {
        newClient.close();
        return;
      }
      await newClient.conversations.sync();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) {
        newClient.close();
        return;
      }
      clientRef.current = newClient;
      log.info("setup: client ready", { convoId: convo.id });

      // pending convos: watch for being added to a matching group
      if (convo.status === "pending") {
        log.trace("setup: pending convo, watching for group match");
        const resolveIfMatch = async (group: Group): Promise<boolean> => {
          await group.sync();
          if (!group.appData) {
            return false;
          }
          try {
            const appData = await decodeAppData(group.appData);
            if (appData.tag !== convo.tag) {
              return false;
            }
          } catch {
            return false;
          }
          log.info("setup: pending convo matched group", { groupId: group.id });
          const { status, slug, creatorInboxId, ...rest } = convo;
          await db.convos.put({ ...rest, xmtpId: group.id });

          // re-fetch conversation from client to get a properly bound object
          await newClient.conversations.sync();
          const conversation =
            await newClient.conversations.getConversationById(group.id);
          if (!conversation) {
            return false;
          }
          setState({
            status: "ready",
            client: newClient,
            conversation,
          });
          postActiveConvo(group.id);

          // register for push notifications (fire-and-forget)
          if (newClient.installationId) {
            registerConvo(newClient.installationId, conversation.topic).catch(
              (err: unknown) => {
                log.warn("push registration failed", err);
              },
            );
          }

          return true;
        };

        // start stream first so no welcome messages are missed
        const stream = await newClient.conversations.streamGroups({
          onValue(group) {
            void resolveIfMatch(group).then((matched) => {
              if (matched && groupStreamRef.current) {
                void groupStreamRef.current.end();
                groupStreamRef.current = null;
              }
            });
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (cancelled) {
          void stream.end();
          return;
        }
        groupStreamRef.current = stream;

        // then check existing groups (added before stream started)
        const consentStates = [ConsentState.Unknown, ConsentState.Allowed];
        const groups = await newClient.conversations.listGroups({
          consentStates,
        });
        for (const group of groups) {
          if (await resolveIfMatch(group)) {
            void stream.end();
            groupStreamRef.current = null;
            return;
          }
        }

        // no match found — show waiting UI while streaming continues
        setState({
          status: "connected",
          client: newClient,
          conversation: null,
        });
        return;
      }

      const conversation = await newClient.conversations.getConversationById(
        convo.xmtpId,
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) {
        newClient.close();
        return;
      }
      if (conversation) {
        log.info("setup: ready", { convoId: convo.id, xmtpId: convo.xmtpId });
        setState({ status: "ready", client: newClient, conversation });
        postActiveConvo(convo.xmtpId);

        // register for push notifications (fire-and-forget)
        if (newClient.installationId) {
          registerConvo(newClient.installationId, conversation.topic).catch(
            (err: unknown) => {
              log.warn("push registration failed", err);
            },
          );
        }

        // start DM invite processing for creator convos
        if (convo.tag && conversation instanceof Group) {
          log.trace("setup: starting DM invite stream");
          const tag = convo.tag;
          const group = conversation;
          void processExistingDms(newClient, tag, group).then(async () => {
            if (cancelled) {
              return;
            }
            const stream = await newClient.conversations.streamAllDmMessages({
              disableSync: true,
              onValue(value) {
                void processDmInvite(value, tag, group);
              },
            });
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (cancelled) {
              void stream.end();
            } else {
              dmStreamRef.current = stream;
            }
          });
        }
      } else {
        log.warn("setup: conversation not found", { xmtpId: convo.xmtpId });
        setState({
          status: "connected",
          client: newClient,
          conversation: null,
        });
      }
    })();
  }, []);

  const createConvo = useCallback(async (): Promise<Convo> => {
    log.trace("createConvo");
    // cancel any in-flight setup
    cancelRef.current?.();
    cancelRef.current = null;

    // close existing streams and client
    if (groupStreamRef.current) {
      void groupStreamRef.current.end();
      groupStreamRef.current = null;
    }
    if (dmStreamRef.current) {
      void dmStreamRef.current.end();
      dmStreamRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }

    convoIdRef.current = null;
    setState(loadingState);

    const privateKey = generatePrivateKey();
    const client = await createClient(privateKey);
    const group = await client.conversations.createGroup([], {
      groupName: "New Convo",
    });

    const tag = await initGroupAppData(group);

    const convo: Convo = {
      lastUpdatedAtNs: group.createdAtNs,
      id: window.crypto.randomUUID(),
      name: "New Convo",
      privateKey,
      xmtpId: group.id,
      tag,
    };

    await db.convos.add(convo);
    log.info("createConvo: convo created", { convoId: convo.id });

    // fetch conversation from the client we just used
    const conversation = await client.conversations.getConversationById(
      group.id,
    );

    convoIdRef.current = convo.id;
    clientRef.current = client;

    if (conversation) {
      setState({ status: "ready", client, conversation });
      postActiveConvo(group.id);

      // register for push notifications (fire-and-forget)
      if (client.installationId) {
        registerConvo(client.installationId, conversation.topic).catch(
          (err: unknown) => {
            log.warn("push registration failed", err);
          },
        );
      }

      // start DM invite processing for join requests
      const stream = await client.conversations.streamAllDmMessages({
        disableSync: true,
        onValue(value) {
          void processDmInvite(value, tag, group);
        },
      });
      dmStreamRef.current = stream;
    } else {
      setState({ status: "connected", client, conversation: null });
    }

    return convo;
  }, []);

  // sync active convo with SW on visibility changes so push notifications
  // are suppressed while viewing a convo but not when the app is backgrounded
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        postActiveConvo(null);
      } else if (state.conversation) {
        postActiveConvo(state.conversation.id);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [state.conversation]);

  // listen for decrypt-message from service worker
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
      // reply to SW: title+body = show notification, skip = suppress
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
        const convos = await db.convos.toArray();
        const convo = convos.find((c) => c.xmtpId === xmtpId);
        if (!convo) {
          log.warn("decrypt: convo not found", { xmtpId });
          return;
        }

        const convoName = convo.name || "Convo";

        if (!payload.message) {
          log.warn("decrypt: no message in payload");
          reply("skip");
          return;
        }

        const envelopeBytes = Uint8Array.from(atob(payload.message), (c) =>
          c.charCodeAt(0),
        );

        // close active client to release OPFS lock
        cancelRef.current?.();
        cancelRef.current = null;
        if (groupStreamRef.current) {
          void groupStreamRef.current.end();
          groupStreamRef.current = null;
        }
        if (dmStreamRef.current) {
          void dmStreamRef.current.end();
          dmStreamRef.current = null;
        }
        if (clientRef.current) {
          clientRef.current.close();
          clientRef.current = null;
        }

        log.debug("decrypt: building client", { xmtpId });
        const tempClient = await createClient(convo.privateKey);
        try {
          const conversation =
            await tempClient.conversations.getConversationById(xmtpId);
          if (!conversation) {
            log.warn("decrypt: conversation not found", { xmtpId });
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

          // always update dexie with the new message
          const dbUpdates: Partial<Convo> = {
            lastUpdatedAtNs: decoded.sentAtNs,
            unread: !isSelf,
          };

          // update db fields and determine whether to notify
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

        // silently reconnect without intermediate loading state
        const activeConvoId = convoIdRef.current;
        if (activeConvoId) {
          const activeConvo = await db.convos.get(activeConvoId);
          if (activeConvo) {
            log.debug("decrypt: reconnecting to active convo", {
              convoId: activeConvoId,
            });
            const newClient = await createClient(activeConvo.privateKey);
            clientRef.current = newClient;
            await newClient.conversations.sync();
            const newConversation =
              await newClient.conversations.getConversationById(
                activeConvo.xmtpId,
              );
            if (newConversation) {
              // single state update — no loading flash
              setState({
                status: "ready",
                client: newClient,
                conversation: newConversation,
              });
              postActiveConvo(activeConvo.xmtpId);
            }
          }
        }
      } catch (err) {
        log.error("decrypt: failed", err);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [setConvo]);

  return (
    <XmtpContext.Provider value={{ ...state, setConvo, createConvo }}>
      {children}
    </XmtpContext.Provider>
  );
};
