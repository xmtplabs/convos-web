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
- `yarn fix` — ESLint auto-fix + Prettier format (run after editing)
- `yarn lint` — ESLint + buf lint
- `yarn format:check` — Prettier check (CI)
- `yarn typecheck` — TypeScript type checking
- `yarn generate` — regenerate protobuf types from `proto/`

## Code Conventions

- Path alias: `@/*` maps to `src/*`
- Imports: sorted by builtin, external, `@/`, relative (enforced by prettier plugin)
- Consistent type imports: `import type { Foo }` or `import { type Foo }`
- No unused variables (prefix with `_` if intentionally unused)
- Prettier: double quotes, trailing commas, 80 char width, no tabs
- ESLint: strict type-checked rules from typescript-eslint

## Logging

Domain-based logging system in `src/utils/log.ts`. Every file gets a domain-specific logger:

```ts
import { createLogger } from "@/utils/log";
const log = createLogger("domain-name");
```

Log messages should NOT repeat the domain name (the `[domain]` prefix handles that).

Levels: `trace`, `debug`, `info`, `warn`, `error`

Configuration priority: `localStorage("convos-log-config")` > `VITE_LOG_DOMAINS` (e.g. `xmtp:trace,sync:debug`) > `VITE_LOG_LEVEL` > fallback `"trace"`

### Active domains

| Domain          | Scope                                            |
| --------------- | ------------------------------------------------ |
| `xmtp`          | XMTP client, conversations, streaming            |
| `invite`        | Invite creation, slug resolution, joining        |
| `explode`       | Self-destructing convos, timers, worker          |
| `db`            | Dexie operations, convos CRUD, avatars, profiles |
| `sync`          | appData sync between XMTP and local DB           |
| `messaging`     | Composer, message list, attachments, reactions   |
| `encryption`    | AES-GCM encrypt/decrypt for images               |
| `app-lock`      | App lock, per-convo lock/unlock, permissions     |
| `router`        | TanStack Router events, navigation, watchdog     |
| `root`          | Root route layout                                |
| `app`           | App component (gate, content, mount)             |
| `app-header`    | Header bar                                       |
| `layout`        | MainLayout                                       |
| `settings`      | AboutModal / settings                            |
| `convo`         | Single convo view                                |
| `convo-header`  | Convo header bar                                 |
| `convo-menu`    | Convo action menu                                |
| `convos-list`   | Sidebar convo list                               |
| `convo-details` | Convo details modal                              |
| `edit-convo`    | Edit convo modal                                 |
| `delete-convo`  | Delete convo modal                               |
| `delete-all`    | Delete all data modal                            |
| `new-convo`     | New convo route                                  |
| `quickname`     | Quickname generator                              |
| `welcome`       | Welcome screen                                   |
| `update`        | Update notification                              |
| `not-found`     | 404 page                                         |

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
- **Encryption**: AES-GCM with HKDF key derivation for avatar images (`src/utils/encryption.ts`)
- **Attachments**: uploaded to Pinata (IPFS), sent as XMTP `RemoteAttachment` content type
- **Exploding convos**: timer stored in XMTP appData, watched by web worker, deletes locally on expiry
- **Service worker** (`public/sw.js`): caches app shell; skips Vite dev server paths (`/src/`, `/@*`, `/__vite*`)

## Known Pitfalls

- The service worker can intercept Vite dev server module requests and cause blank screens. If routes fail to load, check sw.js path exclusions.
- Router can get stuck in `pending` state — there's a watchdog timer in `router.tsx` that logs diagnostics.
- `*.gen.ts` files are generated — never edit them directly; run `yarn generate` instead.
