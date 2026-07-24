# Backend Scripts

Administrative helper scripts for Bailo.

## Running Scripts

Scripts using `defineScript()` should be run directly with `npx tsx`, not via `npm run script` (the legacy runner strips
named flags).

When running from the host, `defineScript()` automatically detects it is outside Docker and reads the MongoDB connection
details from the Docker Compose config file (`backend/config/dev_docker_compose.cjs`), replacing the container hostname
with `localhost`.

```bash
npx tsx src/scripts/exampleScript.ts --modelId abc-123 --dryRun
```

Every script supports `--help`:

```bash
npx tsx src/scripts/exampleScript.ts --help
```

### Legacy Scripts

Older scripts that do not use `defineScript()` rely on `npm run script` and must be run inside the `backend` container
or pod, where the correct `NODE_CONFIG_ENV` and MongoDB hostname are already set.

```bash
# Docker Compose
docker compose exec backend npm run script -- getTopModelCollaborators

# Kubernetes
kubectl exec -it deploy/backend -- npm run script -- getTopModelCollaborators
```

Legacy scripts accept positional arguments only (named flags like `--modelId` are not forwarded):

```bash
docker compose exec backend npm run script -- modelSoftDelete my-model-id
```

New scripts should use `defineScript()` instead - see [Creating a New Script](#creating-a-new-script).

## Creating a New Script

Use `defineScript()` from `scriptHelper.ts`. It handles argument parsing, MongoDB connection, error handling, and
cleanup automatically.

```ts
import log from '../services/log.js'
import { defineScript } from './scriptHelper.js'

defineScript({
  name: 'myScript',
  description: 'What the script does',
  args: (yargs) =>
    yargs
      .option('someFlag', { type: 'string', demandOption: true, describe: 'A required flag' })
      .option('dryRun', { type: 'boolean', default: false, describe: 'Preview without changes' })
      .option('status', {
        choices: ['active', 'disabled'] as const,
      })
      .option('ids', {
        type: 'array',
      }),
  run: async (args) => {
    log.info({ someFlag: args.someFlag }, 'Running')
    // Your logic here - MongoDB is already connected
  },
})
```

### Options

| Option           | Type             | Default | Description                                        |
| ---------------- | ---------------- | ------- | -------------------------------------------------- |
| `name`           | `string`         | -       | Script name (shown in `--help`)                    |
| `description`    | `string`         | -       | One-line description (shown in `--help`)           |
| `args`           | `function`       | -       | Configures [yargs](https://yargs.js.org/) options  |
| `run`            | `async function` | -       | Script logic, receives parsed args                 |
| `connectToMongo` | `boolean`        | `true`  | Set to `false` for scripts that don't need MongoDB |

### Argument Definition

Arguments use [yargs options](https://yargs.js.org/docs/#api-reference-optionkey-opt):

- `type`: `'string'`, `'number'`, `'boolean'`, `'array'`
- `demandOption: true`: makes the flag required
- `default`: default value
- `describe`: help text
- `choices`: restrict to specific values
- `alias`: short flag (e.g., `alias: 'n'` for `-n`)

See `exampleScript.ts` for a working reference.
