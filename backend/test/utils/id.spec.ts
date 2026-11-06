import { describe, expect, test } from 'vitest'

import { convertStringToId, longAlphabet, longId, randomString, shortAlphabet, shortId } from '../../src/utils/id.js'

describe('utils > id', () => {
  test('longId', () => {
    const generatedId = longId()

    // Ensure that all our generated IDs match this UUIDv4 regular expression
    expect(generatedId).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
  })

  test('shortId', () => {
    const generatedId = shortId()

    expect(generatedId).toMatch(/^[0-9a-z]{6}$/)
  })

  test('shortAlphabet', () => {
    expect(shortAlphabet(8)).toMatch(/^[0-9A-Z]{8}$/)
  })

  test('longAlphabet', () => {
    expect(longAlphabet(32)).toMatch(/^[0-9A-Za-z]{32}$/)
  })

  test('randomString > only uses the given alphabet', () => {
    expect(randomString('ab', 100)).toMatch(/^[ab]{100}$/)
    expect(randomString('x', 3)).toEqual('xxx')
    expect(randomString('abc', 0)).toEqual('')
  })

  test('randomString > uses every character of the alphabet', () => {
    expect(new Set(randomString('abc', 300))).toEqual(new Set(['a', 'b', 'c']))
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
