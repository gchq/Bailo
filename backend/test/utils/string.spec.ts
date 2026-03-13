import { describe, expect, test } from 'vitest'

import { plural } from '../../src/utils/string.js'

describe('utils > string', () => {
  test('plural', () => {
    expect(plural(1, 'thing')).toEqual('1 thing')
    expect(plural(2, 'thing')).toEqual('2 things')
    expect(plural(1, 'bus')).toEqual('1 bus')
    expect(plural(2, 'bus')).toEqual('2 buses')
  })
})
