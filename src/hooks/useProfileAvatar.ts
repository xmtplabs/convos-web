import { useEffect, useState } from "react";
import type { Profile } from "@/db";
import { decrypt } from "@/utils/encryption";
import { createLogger } from "@/utils/log";

const log = createLogger("db");

export const useProfileAvatar = (profile: Profile | null) => {
  const [src, setSrc] = useState<string | null>(null);

  const { avatarUrl, avatarKey, avatarSalt, avatarNonce } = profile ?? {};

  useEffect(() => {
    log.trace("avatar effect start", { hasAvatarUrl: !!avatarUrl });
    if (!avatarUrl || !avatarKey || !avatarSalt || !avatarNonce) {
      setSrc(null);
      return;
    }
    const ctrl = new AbortController();
    void (async () => {
      try {
        log.info("avatar fetch start", { avatarUrl });
        const response = await fetch(avatarUrl, { signal: ctrl.signal });
        if (!response.ok) {
          log.warn("avatar fetch failed", { status: response.status });
          return;
        }
        const ciphertext = new Uint8Array(await response.arrayBuffer());
        log.debug("avatar decrypt start", { size: ciphertext.byteLength });
        const decrypted = await decrypt(
          ciphertext,
          avatarKey,
          avatarSalt,
          avatarNonce,
        );
        if (ctrl.signal.aborted) {
          log.debug("avatar fetch aborted after decrypt");
          return;
        }
        const blob = new Blob([decrypted]);
        setSrc(URL.createObjectURL(blob));
        log.info("avatar loaded successfully", { size: decrypted.byteLength });
      } catch (err) {
        log.error("avatar fetch/decrypt error", err);
      }
    })();
    return () => {
      log.debug("avatar effect cleanup, aborting fetch");
      ctrl.abort();
    };
  }, [avatarUrl, avatarKey, avatarSalt, avatarNonce]);

  return src;
};
