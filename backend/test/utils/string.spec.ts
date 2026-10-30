import { describe, expect, test } from 'vitest'

import { outdent, plural, toTitleCase } from '../../src/utils/string.js'

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

  test('outdent > removes first line indentation and surrounding newlines', () => {
    const result = outdent`
      # Title

        indented
      ${'value'}
    `

    expect(result).toEqual('# Title\n\n  indented\nvalue')
  })

  test('outdent > does not re-indent interpolated values', () => {
    const result = outdent`
      ${'first\n    second'}
    `

    expect(result).toEqual('first\n    second')
  })

  test('outdent > keeps explicit escaped newlines', () => {
    const result = outdent`\n\n
        ## ${'Title'}
    `

    expect(result).toEqual('\n\n## Title')
  })

  test('outdent > single line is unchanged', () => {
    expect(outdent`no newline ${1}`).toEqual('no newline 1')
  })
})
