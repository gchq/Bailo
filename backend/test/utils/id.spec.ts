import { describe, expect, test } from 'vitest'

import { convertStringToId, longId, shortId } from '../../src/utils/v2/id.js'

describe('utils > id', () => {
  test('longId', () => {
    const generatedId = longId()

    // Ensure that all our generated IDs match this UUIDv4 regular expression
    expect(generatedId).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
  })

  test('shortId', () => {
    const generatedId = shortId()

    expect(generatedId).toMatch(/\w{6}/)
  })

  test('convertStringToId > general', () => {
    expect(convertStringToId('An Example Model Name')).toMatch(/^an-example-model-name-\w{6}/)
  })

  test('convertStringToId > emoji', () => {
    expect(convertStringToId('An Example Model Name😊')).toMatch(/^an-example-model-name-\w{6}/)
  })

  test('convertStringToId > short', () => {
    expect(convertStringToId('')).toMatch(/^-\w{6}/)
  })
})
