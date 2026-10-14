import { createRequire } from 'node:module'

import { Util } from 'config/lib/util.js'
import { afterEach, vi } from 'vitest'

import { PartialDeep } from '../../src/types/types.js'
import type { Config } from '../../src/utils/config.js'

// Required directly rather than imported to keep the CJS file away from vite & skip the `config` package's layering, which would pull in the gitignored `config/local.cjs`
const requireCjs = createRequire(import.meta.url)
const defaultConfig = requireCjs('../../config/default.cjs') as Config

// node-config silently copies references past its depth limit, so add overhead for the config tree's depth
const CLONE_DEPTH = 40

/** Test-only deviations. Everything not listed here tracks `config/default.cjs`. */
const overrides: PartialDeep<Config> = {
  app: {
    // Never resolve, unlike the real certs on a machine that has run `npm run certs`
    privateKey: 'privateKey',
    publicKey: 'publicKey',
    jwks: 'jwks',
  },
  mongo: {
    uri: 'mongodb://mock',
  },
  federation: {
    // Absent from `config/default.cjs` - `connectors/peer/index.ts` iterates `peers`
    id: 'localBailo',
    isEscalationEnabled: false,
    peers: {},
  },
  smtp: {
    enabled: true,
  },
  oauth: {
    cognito: {
      adminGroupName: 'admin',
      complianceGroupName: 'compliance',
      untrustedModelGroupName: 'untrusted-model',
    },
  },
  ui: {
    inference: {
      enabled: true,
    },
    lifecycle: {
      // Read at import time by `services/v3/review.ts`
      maxReviewInterval: '1 year',
    },
  },
  modelMirror: {
    metadataFile: 'meta.json',
    contentDirectory: 'content-dir',
    export: {
      // Deterministic export ordering
      concurrency: 1,
    },
  },
  inference: {
    // Non-empty so the token guard passes
    authorisationToken: 'test',
  },
}

function buildTestConfig(): Config {
  // Clone first as `defaultConfig` is node's require-cache object and must not be mutated
  return Util.extendDeep(Util.cloneDeep(defaultConfig, CLONE_DEPTH), overrides, CLONE_DEPTH) as Config
}

// A factory keeps this reference stable across `vi.resetModules()`
const testConfig = buildTestConfig()

vi.mock('../../src/utils/config.js', () => ({ __esModule: true, default: testConfig }))

/** Merges overrides into the mocked config, reverted after each test. Arrays are replaced, `undefined` unsets. */
export function setTestConfig(partialConfig: PartialDeep<Config>) {
  Util.extendDeep(testConfig, partialConfig, CLONE_DEPTH)
}

afterEach(() => {
  for (const key of Object.keys(testConfig) as Array<keyof Config>) {
    delete testConfig[key]
  }
  Object.assign(testConfig, buildTestConfig())
})
