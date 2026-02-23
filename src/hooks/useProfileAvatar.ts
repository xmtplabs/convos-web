import { useEffect, useState } from "react";
import type { Profile } from "@/db";
import { decrypt } from "@/utils/encryption";

export const useProfileAvatar = (profile: Profile | null) => {
  const [src, setSrc] = useState<string | null>(null);

  const { avatarUrl, avatarKey, avatarSalt, avatarNonce } = profile ?? {};

  useEffect(() => {
    if (!avatarUrl || !avatarKey || !avatarSalt || !avatarNonce) {
      setSrc(null);
      return;
    }
    const ctrl = new AbortController();
    void (async () => {
      try {
        const response = await fetch(avatarUrl, { signal: ctrl.signal });
        if (!response.ok) return;
        const ciphertext = new Uint8Array(await response.arrayBuffer());
        const decrypted = await decrypt(
          ciphertext,
          avatarKey,
          avatarSalt,
          avatarNonce,
        );
        if (ctrl.signal.aborted) return;
        const blob = new Blob([decrypted]);
        setSrc(URL.createObjectURL(blob));
      } catch {
        // ignore fetch/decrypt errors
      }
    })();
    return () => {
      ctrl.abort();
    };
  }, [avatarUrl, avatarKey, avatarSalt, avatarNonce]);

  return src;
};
