# Convos Web

Everyday private chat for the surveillance age. No signup. No numbers. No history.

The web client for [Convos](https://convos.org) — an invitation-only messenger built on the open-source, censorship-resistant [XMTP protocol](https://xmtp.org). Messages are encrypted on-device using MLS. Your identity and message data stay on your device — there is no server. Installable as a PWA.

> [!WARNING]
> This project is in alpha. Expect bugs, incomplete features, and design changes.

## Tech Stack

- **Messaging**: XMTP browser SDK (MLS, end-to-end encryption)
- **Frontend**: React, Mantine, TanStack Router
- **Storage**: Dexie (IndexedDB), OPFS (XMTP Wasm client)
- **Encryption**: AES-GCM image encryption, ECDSA invite signing
- **Protobuf**: `@bufbuild/protobuf` for compact wire format

## Prerequisites

- Node.js >= 24
- Yarn 4

## Setup

```bash
yarn install
```

Create a `.env` file with the required environment variables:

```
PINATA_JWT=
PINATA_GATEWAY=
PINATA_GROUP_ID=
VITE_PINATA_GATEWAY=
```

## Development

```bash
yarn dev
```

The app runs at `http://localhost:3000`.

## Scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `yarn dev`          | Start the dev server                           |
| `yarn build`        | Production build                               |
| `yarn preview`      | Preview the production build                   |
| `yarn fix`          | oxlint auto-fix + oxfmt format                 |
| `yarn lint`         | Run oxlint (includes type-checking) + buf lint |
| `yarn format:check` | Check formatting with oxfmt                    |
| `yarn generate`     | Generate TypeScript from protobuf definitions  |
| `yarn clean`        | Remove `dist` and `node_modules`               |
| `yarn reset`        | Clean and reinstall dependencies               |

## Project Structure

```
src/
  components/   # React components
  contexts/     # React context providers (XMTP, Convo)
  gen/          # Generated protobuf TypeScript (do not edit)
  hooks/        # Custom React hooks
  layouts/      # Layout components
  routes/       # TanStack Router file-based routes
  utils/        # Utility functions (encryption, XMTP, etc.)
proto/          # Protobuf definitions
public/         # Static assets, service worker
```

## Protobuf

Proto definitions live in `proto/convos/v1/`. After editing `.proto` files, regenerate the TypeScript bindings:

```bash
yarn generate
```

Generated files go to `src/gen/` and should not be edited manually.
