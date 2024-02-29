import { describe, expect, test } from 'vitest'

import { fromEntity, toEntity } from '../../src/utils/v2/entity.js'

describe('utils > entity', () => {
  test('toEntity', () => {
    expect(toEntity('user', 'test')).toBe('user:test')
    expect(toEntity('group', 'test:value')).toBe('group:test:value')
  })

  test('fromEntity', () => {
    expect(fromEntity('user:test')).toStrictEqual({ kind: 'user', value: 'test' })
    expect(fromEntity('example:test:value')).toStrictEqual({ kind: 'example', value: 'test:value' })
  })
})
