import { describe, expect, test } from 'vitest'

import { plural, toTitleCase } from '../../src/utils/string.js'

describe('utils > string', () => {
  test('plural', () => {
    expect(plural(1, 'thing')).toEqual('1 thing')
    expect(plural(2, 'thing')).toEqual('2 things')
    expect(plural(1, 'bus')).toEqual('1 bus')
    expect(plural(2, 'bus')).toEqual('2 buses')
  })

  test('toTitleCase', () => {
    expect(toTitleCase('hello world')).toEqual('Hello World')
    expect(toTitleCase('HELLO WORLD')).toEqual('Hello World')
    expect(toTitleCase('single')).toEqual('Single')
    expect(toTitleCase('hello-world')).toEqual('Hello World')
    expect(toTitleCase('hello_world')).toEqual('Hello World')
    expect(toTitleCase('model', '-')).toEqual('Model')
    expect(toTitleCase('data-card', '-')).toEqual('Data card')
  })
})
