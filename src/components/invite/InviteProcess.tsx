import { Paper } from "@mantine/core";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { InvalidInvite } from "@/components/invite/InviteInvalid";
import { InviteRequest } from "@/components/invite/InviteRequest";
import { db } from "@/db";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import {
  parseInviteSlug,
  sendJoinRequest,
  type ParsedInvite,
} from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("invite-process");

export const InviteProcess: React.FC = () => {
  log.trace("render");
  const { slug } = useParams({ from: "/_app/i/$slug" });
  log.debug("slug length", { length: slug.length });
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>(undefined);
  const joining = useRef(false);

  const parsed = useMemo((): ParsedInvite | null => {
    try {
      const result = parseInviteSlug(slug);
      log.info("parsed", { payload: result.payload });
      return result;
    } catch (err) {
      log.error("invalid invite slug", err);
      return null;
    }
  }, [slug]);

  useEffect(() => {
    if (!parsed || joining.current) return;
    joining.current = true;

    const tag = parsed.payload.tag;
    const join = async () => {
      // check if already in this group or have a pending request
      const existing = await db.convos
        .filter((c) => c.tag === tag || c.slug === parsed.slug)
        .first();
      if (existing) {
        log.info("already joined or pending", { convoId: existing.id });
        void navigate({
          to: "/convo/$convoId",
          params: { convoId: existing.id },
        });
        return;
      }

      const convo = await sendJoinRequest(parsed);
      void navigate({
        to: "/convo/$convoId",
        params: { convoId: convo.id },
      });
    };

    log.info("auto-joining", { payload: parsed.payload });
    join().catch((e: unknown) => {
      log.error("join request failed", e);
      joining.current = false;
      setError(e instanceof Error ? e.message : "Failed to send join request");
    });
  }, [parsed, navigate]);

  return (
    <CenteredLayout>
      <Paper p="xl" radius="md" bg="gray.1">
        {parsed ? <InviteRequest error={error} /> : <InvalidInvite />}
      </Paper>
    </CenteredLayout>
  );
};
