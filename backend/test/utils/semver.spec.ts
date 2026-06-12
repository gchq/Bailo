import { describe, expect, test } from 'vitest'

import { SemverObject } from '../../src/models/Release.js'
import { semverObjectToString, semverStringToObject } from '../../src/utils/semver.js'

describe('', () => {
  test('semverStringToObject > parses a semver string without metadata', () => {
    expect(semverStringToObject('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
    })
  })

  test('semverStringToObject > parses a semver string with a v prefix', () => {
    expect(semverStringToObject('v1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
    })
  })

  test('semverStringToObject > parses metadata when present', () => {
    expect(semverStringToObject('v1.2.3-test')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      metadata: 'test',
    })
  })

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

  test('semverObjectToString > deals with edge cases', () => {
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
