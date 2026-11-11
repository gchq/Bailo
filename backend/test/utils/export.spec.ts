import { describe, expect, test } from 'vitest'

import { recursiveRender } from '../../src/utils/export.js'

describe('utils > export > recursiveRender', () => {
  test('tagSelector > prints No entries when empty', () => {
    const schema: any = {
      type: 'array',
      widget: 'tagSelector',
      title: 'Tags',
      items: { type: 'string', maxLength: 100, title: 'Tag' },
    }

    const out = recursiveRender(undefined, schema)

    expect(out).toContain('# Tags')
    expect(out).toContain('No entries')
  })

  test('tagSelector > lists tags when present', () => {
    const schema: any = {
      type: 'array',
      widget: 'tagSelector',
      title: 'Tags',
      items: { type: 'string', maxLength: 100, title: 'Tag' },
    }

    const out = recursiveRender(['one', 'two'], schema)

    expect(out).toContain('# Tags')
    expect(out).toContain('- one')
    expect(out).toContain('- two')
  })

  test('object > renders nested fields with titles', () => {
    const schema: any = {
      type: 'object',
      title: 'Root',
      properties: {
        s: { type: 'string', title: 'S', maxLength: 100 },
        n: { type: 'number', title: 'N' },
        b: { type: 'boolean', title: 'B' },
      },
    }

    const out = recursiveRender({ s: 'hello', n: 5, b: true }, schema)

    expect(out).toContain('# Root')
    expect(out).toContain('## S')
    expect(out).toContain('hello')
    expect(out).toContain('## N')
    expect(out).toContain('5')
    expect(out).toContain('## B')
    expect(out).toContain('Yes')
  })

  test('object > missing responses show "No response"', () => {
    const schema: any = {
      type: 'object',
      title: 'Root',
      properties: {
        s: { type: 'string', title: 'S', maxLength: 100 },
        n: { type: 'number', title: 'N' },
        b: { type: 'boolean', title: 'B' },
      },
    }

    const out = recursiveRender({}, schema)

    expect(out).toContain('## S')
    expect(out).toContain('## N')
    expect(out).toContain('## B')
    expect(out).toContain('No response')
  })

  test('string without title > renders raw content', () => {
    const schema: any = { type: 'string', maxLength: 100 }
    const out = recursiveRender('plain text', schema)

    // should not include a heading, but include the content
    expect(out).not.toMatch(/#\s/)
    expect(out).toContain('plain text')
  })

  test('array of strings > renders entries and item titles', () => {
    const schema: any = {
      type: 'array',
      title: 'Items',
      items: { type: 'string', title: 'Name', maxLength: 20 },
    }

    const out = recursiveRender(['a', 'b'], schema)

    expect(out).toContain('# Items')
    // Each entry heading
    expect(out).toContain('## Entry #1')
    // Item title and values
    expect(out).toContain('## Name')
    expect(out).toContain('a')
    expect(out).toContain('b')
  })

  test('array > prints No entries when empty', () => {
    const schema: any = { type: 'array', title: 'List', items: { type: 'number', title: 'Value' } }
    const out = recursiveRender([], schema)

    expect(out).toContain('# List')
    expect(out).toContain('No entries')
  })

  test('unknown type > throws', () => {
    const schema: any = { type: 'date', title: 'When' }
    expect(() => recursiveRender('2024-01-01', schema)).toThrow(/not been implemented/)
  })
})
