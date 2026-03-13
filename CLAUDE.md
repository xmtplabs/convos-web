# Convos Web

Private messaging web client built on the XMTP protocol.

## Stack

- React 19, TypeScript 5.9, Vite 7
- TanStack Router (file-based routing, `ssr: false` on all routes)
- Mantine 8 (UI components, `@mantine/core`, `@mantine/dates`, `@mantine/hooks`)
- Dexie 4 (IndexedDB wrapper, see `src/db.ts` for schema)
- XMTP Browser SDK 6 (`@xmtp/browser-sdk`)
- Lucide React (icons)
- Protobuf (`@bufbuild/protobuf`, definitions in `proto/`, generated to `src/gen/`)
- Yarn 4, Node >= 24

## Commands

- `yarn dev` — dev server on port 3000
- `yarn build` — production build
- `yarn fix` — oxlint auto-fix + oxfmt format (run after editing)
- `yarn lint` — oxlint (includes type-checking) + buf lint
- `yarn format:check` — oxfmt check (CI)
- `yarn generate` — regenerate protobuf types from `proto/`

## Code Conventions

- Path alias: `@/*` maps to `src/*`
- Imports: sorted by builtin, external, `@/`, relative (enforced by prettier plugin)
- Consistent type imports: `import type { Foo }` or `import { type Foo }`
- No unused variables (prefix with `_` if intentionally unused)
- oxfmt: double quotes, trailing commas, 80 char width, no tabs
- oxlint: strict rules (all set to `"error"`, no `"warn"`), config in `.oxlintrc.json`
- Comments: single-line `//` comments start with lowercase (e.g. `// sync data to local DB`)

## Logging

Domain-based logging system in `src/utils/log.ts`. All domains are predefined in the `LOG_DOMAINS` array and `createLogger` is typed to only accept valid domains. To add a new domain, add it to the `LOG_DOMAINS` array in `src/utils/log.ts`.

```ts
import { createLogger } from "@/utils/log";
const log = createLogger("domain-name"); // must be a valid LogDomain
```

Log messages should NOT repeat the domain name (the `[domain]` prefix handles that).

Levels: `trace`, `debug`, `info`, `warn`, `error`, `off`

### Configuration priority (highest first)

1. **localStorage** (`convos-log-config`) — real-time, overrides everything
2. **Env var per-domain** — browser: `VITE_LOG_DOMAINS`, server: `LOG_DOMAINS` (e.g. `xmtp:trace,sync:debug`)
3. **Env var global** — browser: `VITE_LOG_LEVEL`, server: `LOG_LEVEL`
4. **Fallback** — `"trace"` for dev/local, `"off"` for production (based on `XMTP_ENV`)

### Runtime control

```ts
import { setLogLevel, resetLogConfig } from "@/utils/log";
setLogLevel("xmtp", "error"); // mute xmtp except errors
setLogLevel("sync", "off"); // silence sync entirely
resetLogConfig(); // clear all overrides
```

Changes take effect immediately — no reload needed.

### Adding a domain

All domains are predefined in the `LOG_DOMAINS` array in `src/utils/log.ts`. `createLogger` only accepts valid domains (typed union). To add a new domain, add it to the `LOG_DOMAINS` array.

## Project Structure

```
src/
  components/app/       # App shell (header, lock screen, welcome)
  components/convos/    # Convo list, single convo, menus
  components/messages/  # Composer, message list, attachments, reactions
  components/modals/    # All modals (about, delete, edit, invite, lock, explode)
  components/settings/  # LogSettings (dev-only)
  contexts/             # React contexts (XMTP, Convo, AppLock)
  gen/                  # Generated protobuf types (DO NOT EDIT)
  hooks/                # Custom hooks
  layouts/              # MainLayout
  routes/               # TanStack Router file-based routes
  utils/                # Pure utilities (xmtp, encryption, attachment, log, etc.)
  workers/              # Web workers (explode watcher)
  db.ts                 # Dexie database schema and instance
  globals.d.ts          # Vite env type declarations
  router.tsx            # Router config with event logging + watchdog
proto/                  # Protobuf definitions
public/                 # Static assets, service worker (sw.js)
```

## Key Architecture

- **XMTP conversations are "groups"** — even 1:1 chats use XMTP groups
- **Convo metadata** lives in both XMTP `appData` and local Dexie DB, synced via `src/utils/appData.ts`
- **ConvoContext** exposes action functions (`lock`, `unlock`, `removeMember`, `updateName`, `updateImage`, etc.) — consumers use `useConvo()` and never access the XMTP `conversation` object directly. The `conversation` is internal to the context and can be null while loading.
- **XmtpContext** manages the XMTP client lifecycle. Use `useXmtp()` hook to access it.
- **Encryption**: AES-GCM with HKDF key derivation for avatar images (`src/utils/encryption.ts`)
- **Attachments**: uploaded to Pinata (IPFS), sent as XMTP `RemoteAttachment` content type
- **Exploding convos**: timer stored in XMTP appData, watched by web worker, deletes locally on expiry
- **Service worker** (`public/sw.js`): caches app shell; skips Vite dev server paths (`/src/`, `/@*`, `/__vite*`)

## Known Pitfalls

- The service worker can intercept Vite dev server module requests and cause blank screens. If routes fail to load, check sw.js path exclusions.
- Router can get stuck in `pending` state — there's a watchdog timer in `router.tsx` that logs diagnostics.
- `*.gen.ts` files are generated — never edit them directly; run `yarn generate` instead.
