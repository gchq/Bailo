import { describe, expect, test } from 'vitest'

import { SemverObject } from '../../src/models/Release.js'
import { semverObjectToString } from '../../src/utils/semver.js'

describe('', () => {
  test('semverObjectToString > deals with edge cases', async () => {
    const semObj: SemverObject = {
      major: 1,
      minor: 1,
      patch: 1,
      metadata: 'test',
    }
    const semObj2: SemverObject = {
      major: 1,
      minor: 1,
      patch: 1,
    }
    expect(semverObjectToString(semObj)).toBe('1.1.1-test')
    expect(semverObjectToString(undefined as any)).toBe('')
    expect(semverObjectToString(semObj2)).toBe('1.1.1')
  })
})
