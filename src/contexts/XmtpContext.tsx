import {
  ConsentState,
  Group,
  type AsyncStreamProxy,
  type BuiltInContentTypes,
  type Client,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { createContext, useCallback, useRef, useState } from "react";
import { generatePrivateKey } from "viem/accounts";
import { db, type Convo } from "@/db";
import { decodeAppData, initGroupAppData } from "@/utils/appData";
import { processDmInvite, processExistingDms } from "@/utils/invite";
import { buildClient, createClient } from "@/utils/xmtp";

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
    if (convo?.id === convoIdRef.current) return;

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
      setState(idleState);
      return;
    }

    convoIdRef.current = convo.id;

    setState(loadingState);

    let cancelled = false;
    cancelRef.current = () => {
      cancelled = true;
    };

    // Wait for previous setup to finish before starting a new one
    const prevSetup = setupRef.current;
    setupRef.current = (async () => {
      await prevSetup;

      // Close previous streams and client after setup has settled
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
      if (cancelled) return;

      const newClient = await buildClient(convo.privateKey);
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

      // Pending convos: watch for being added to a matching group
      if (convo.status === "pending") {
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
          const { status, slug, creatorInboxId, ...rest } = convo;
          await db.convos.put({ ...rest, xmtpId: group.id });

          // Re-fetch conversation from client to get a properly bound object
          await newClient.conversations.sync();
          const conversation =
            await newClient.conversations.getConversationById(group.id);
          if (!conversation) return false;
          setState({
            status: "ready",
            client: newClient,
            conversation,
          });
          return true;
        };

        // Check existing groups first (added while offline)
        const consentStates = [ConsentState.Unknown, ConsentState.Allowed];
        const groups = await newClient.conversations.listGroups({
          consentStates,
        });
        for (const group of groups) {
          if (await resolveIfMatch(group)) return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (cancelled) return;

        // No match found — show waiting UI while streaming continues
        setState({
          status: "connected",
          client: newClient,
          conversation: null,
        });

        // Stream new groups
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
        } else {
          groupStreamRef.current = stream;
        }
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
        setState({ status: "ready", client: newClient, conversation });

        // Start DM invite processing for creator convos
        if (convo.tag && conversation instanceof Group) {
          const tag = convo.tag;
          const group = conversation;
          void processExistingDms(newClient, tag, group).then(async () => {
            if (cancelled) return;
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
        setState({
          status: "connected",
          client: newClient,
          conversation: null,
        });
      }
    })();
  }, []);

  const createConvo = useCallback(async (): Promise<Convo> => {
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

    // fetch conversation from the client we just used
    const conversation = await client.conversations.getConversationById(
      group.id,
    );

    convoIdRef.current = convo.id;
    clientRef.current = client;

    if (conversation) {
      setState({ status: "ready", client, conversation });
    } else {
      setState({ status: "connected", client, conversation: null });
    }

    return convo;
  }, []);

  return (
    <XmtpContext.Provider value={{ ...state, setConvo, createConvo }}>
      {children}
    </XmtpContext.Provider>
  );
};
