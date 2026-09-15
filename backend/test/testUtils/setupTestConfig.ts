import { cloneDeep, mergeWith } from 'lodash-es'
import { afterEach, vi } from 'vitest'

import { PartialDeep } from '../../src/types/types.js'
import defaultTestConfig from '../../src/utils/__mocks__/config.js'
import type { Config } from '../../src/utils/config.js'

// A factory keeps this reference stable across `vi.resetModules()`
const testConfig = cloneDeep(defaultTestConfig)

vi.mock('../../src/utils/config.js', () => ({ __esModule: true, default: testConfig }))

/** Merges overrides into the mocked config, reverted after each test. Assign directly to unset a value. */
export function setTestConfig(overrides: PartialDeep<Config>) {
  mergeWith(testConfig, overrides, (_target, source) => (Array.isArray(source) ? source : undefined))
}

afterEach(() => {
  for (const key of Object.keys(testConfig) as Array<keyof Config>) {
    delete testConfig[key]
  }
  Object.assign(testConfig, cloneDeep(defaultTestConfig))
})
