# Backend Scripts

Administrative helper scripts for Bailo.

## Running Scripts

All scripts must be executed inside the `backend` container/pod using `npx tsx`. Each script supports `--help` which
shows its options and example invocations for Docker Compose and Kubernetes.

```console
$ npx tsx src/scripts/exampleScript.ts --help
Example script demonstrating the defineScript pattern

Usage: exampleScript [options]

Options:
  --version  Show version number                                       [boolean]
  --modelId  The model ID to look up                         [string] [required]
  --dryRun   Preview without making changes           [boolean] [default: false]
  --help     Show help                                                 [boolean]

Run inside the backend container/pod:
  docker compose exec backend npx tsx src/scripts/exampleScript.ts [options]
  kubectl exec -it deploy/backend -- npx tsx src/scripts/exampleScript.ts [options]
```

### Legacy Scripts

Older scripts that do not use `defineScript()` rely on `npm run script`.

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
