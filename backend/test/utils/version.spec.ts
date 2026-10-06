import { describe, expect, test } from 'vitest'

import { sortSemvers } from '../../src/utils/version.js'

describe('utils > version > sortSemvers', () => {
  test('sorts versions in ascending order by default', () => {
    expect(sortSemvers(['2.0.0', '1.0.0', '1.5.0'])).toEqual(['1.0.0', '1.5.0', '2.0.0'])
  })

  test('sorts versions in ascending order when asc is true', () => {
    expect(sortSemvers(['3.0.0', '1.0.0', '2.0.0'], true)).toEqual(['1.0.0', '2.0.0', '3.0.0'])
  })

  test('sorts versions in descending order when asc is false', () => {
    expect(sortSemvers(['1.0.0', '3.0.0', '2.0.0'], false)).toEqual(['3.0.0', '2.0.0', '1.0.0'])
  })

  test('handles prerelease versions correctly', () => {
    expect(sortSemvers(['1.0.0', '1.0.0-beta.1', '1.0.0-alpha.1'])).toEqual(['1.0.0-alpha.1', '1.0.0-beta.1', '1.0.0'])
  })

  test('handles duplicate semvers', () => {
    expect(sortSemvers(['7.3.5', '1.0.0', '3.4.4', '9.0.2', '1.0.0'])).toEqual([
      '1.0.0',
      '1.0.0',
      '3.4.4',
      '7.3.5',
      '9.0.2',
    ])
  })
})
