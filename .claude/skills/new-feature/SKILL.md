---
name: new-feature
description: Scaffold a new feature following project conventions — route, component, hook, util, and logging setup
---

# New Feature Scaffold

Use this skill when creating a new feature that needs routes, components, hooks, or utils. Follow the exact patterns below — do not deviate from the project conventions.

## Pre-flight

1. Confirm the feature name and scope with the user
2. Determine which layers are needed: route, modal, component, hook, util, context

## File Naming

- Components: `PascalCase.tsx` (e.g. `MuteConvoModal.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g. `useMute.ts`)
- Utils: `camelCase.ts` (e.g. `mute.ts`)
- Routes: kebab-style matching URL segments (e.g. `mute.tsx` for `/convo/$convoId/mute`)

## Logger Setup

Every file gets a domain-specific logger as the first thing after imports:

```typescript
import { createLogger } from "@/utils/log";

const log = createLogger("domain-name");
```

Domain name should match the file/feature (e.g. `"mute-convo"` for MuteConvoModal). Messages must NOT repeat the domain name.

After creating the file, add the new domain to the "Active domains" table in `CLAUDE.md`.

## Import Order

Enforced by prettier plugin. Follow this order:
1. External libraries (`react`, `@mantine/core`, `lucide-react`, `@xmtp/browser-sdk`)
2. Path alias imports (`@/hooks/...`, `@/utils/...`, `@/components/...`)
3. Relative imports (`./SiblingComponent`)

Use `import type { Foo }` or `import { type Foo }` for type-only imports.

## Export Pattern

Always use named exports. Never use default exports.

```typescript
export const MyComponent: React.FC<MyComponentProps> = ({ ... }) => { ... };
export const useMyHook = () => { ... };
export const myFunction = () => { ... };
export type MyType = { ... };
```

## Route Pattern

Routes live in `src/routes/` and use TanStack Router file-based routing.

### Data route (page)

File: `src/routes/_app/feature.tsx`

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyComponent } from "@/components/feature/MyComponent";
import { getData } from "@/utils/feature";
import { createLogger } from "@/utils/log";

const log = createLogger("feature");

const FeatureRoute = () => {
  log.trace("render");
  const data = Route.useLoaderData();
  return <MyComponent data={data} />;
};

export const Route = createFileRoute("/_app/feature")({
  component: FeatureRoute,
  ssr: false,
  loader: async () => {
    const data = await getData();
    if (!data) throw redirect({ to: "/" });
    return data;
  },
});
```

### Modal route (nested under convo)

File: `src/routes/_app/convo/$convoId/action.tsx`

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { ActionModal } from "@/components/modals/ActionModal";
import { createLogger } from "@/utils/log";

const log = createLogger("action");

const ActionRoute = () => {
  const router = useRouter();
  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <ActionModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/action")({
  component: ActionRoute,
  ssr: false,
});
```

## Modal Component Pattern

File: `src/components/modals/ActionModal.tsx`

```typescript
import { Button, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";

const log = createLogger("action");

type ActionModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const ActionModal: React.FC<ActionModalProps> = ({ opened, onClose }) => {
  const { convo, conversation } = useConvo();
  const [loading, setLoading] = useState(false);

  log.trace("render", { convoId: convo.id });

  const handleAction = async () => {
    log.info("started", { convoId: convo.id });
    setLoading(true);
    try {
      // Business logic here
      log.info("succeeded", { convoId: convo.id });
      onClose();
    } catch (err) {
      log.error("failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        log.info("dismissed");
        onClose();
      }}
      title="Action Title">
      <Stack gap="md">
        <Text size="sm">Description of what this action does.</Text>
        <Group justify="flex-end" gap="xxs">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void handleAction()} loading={loading}>
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
```

For destructive actions, use `color="red"` on the confirm button.

## Regular Component Pattern

File: `src/components/feature/MyComponent.tsx`

```typescript
import { Box, Text } from "@mantine/core";
import { createLogger } from "@/utils/log";

const log = createLogger("my-component");

type MyComponentProps = {
  data: SomeType;
};

export const MyComponent: React.FC<MyComponentProps> = ({ data }) => {
  log.trace("render", { id: data.id });

  return (
    <Box>
      <Text>{data.name}</Text>
    </Box>
  );
};
```

## Hook Pattern

File: `src/hooks/useFeature.ts`

```typescript
import { useCallback, useContext } from "react";
import { SomeContext } from "@/contexts/SomeContext";
import { createLogger } from "@/utils/log";

const log = createLogger("feature");

export const useFeature = () => {
  const context = useContext(SomeContext);
  if (!context) {
    throw new Error("useFeature must be used within SomeProvider");
  }

  const doAction = useCallback(async () => {
    log.info("action start");
    // logic
    log.info("action complete");
  }, []);

  return { doAction };
};
```

## Util Pattern

File: `src/utils/feature.ts`

```typescript
import { db, type Convo } from "@/db";
import { createLogger } from "@/utils/log";

const log = createLogger("feature");

export const getFeatureData = (id: string) => {
  log.trace("getFeatureData", { id });
  return db.convos.get(id);
};

export const updateFeatureData = (id: string, changes: Partial<Convo>) => {
  log.trace("updateFeatureData", { id, keys: Object.keys(changes) });
  return db.convos.update(id, changes);
};
```

## Navigation

Use TanStack Router's `useNavigate` or `<Link>`:

```typescript
const navigate = useNavigate();
void navigate({
  to: "/convo/$convoId/action",
  params: { convoId: convo.id },
});
```

## Checklist

After scaffolding, verify:

- [ ] All files use `createLogger` with a unique domain name
- [ ] New domains added to CLAUDE.md "Active domains" table
- [ ] All exports are named (no default exports)
- [ ] Modal props include `opened: boolean` and `onClose: () => void`
- [ ] Route has `ssr: false`
- [ ] Route exports `const Route = createFileRoute(...)`
- [ ] `yarn fix` passes clean
- [ ] `yarn typecheck` passes clean
