import { describe, expect, test } from 'vitest'

import { arrayOfObjectsHasKeys, hasKeys, hasKeysOfType } from '../../src/utils/typeguards.js'

describe('utils > typeguards', () => {
  test('hasKeys', async () => {
    expect(hasKeys({ a: 'a', b: 1 }, ['a'])).toStrictEqual(true)
    expect(hasKeys({ a: 'a', b: 1 }, ['b'])).toStrictEqual(true)
    expect(hasKeys({ a: 'a', b: 1 }, ['a', 'b'])).toStrictEqual(true)
    expect(hasKeys({ a: 'a', b: 1 }, [])).toStrictEqual(true)
    expect(hasKeys({}, [])).toStrictEqual(true)
    expect(hasKeys({ a: 'a', b: 1 }, ['a', 'b', 'a'])).toStrictEqual(true)

    expect(hasKeys({ a: 'a', b: 1 }, ['c'])).toStrictEqual(false)
    expect(hasKeys({ a: 'a', b: 1 }, ['a', 'b', 'c'])).toStrictEqual(false)

    expect(hasKeys(null, [])).toStrictEqual(false)
    expect(hasKeys(hasKeys, [])).toStrictEqual(false)
    expect(hasKeys(['a', 'b'], ['a'])).toStrictEqual(false)
  })

  test('hasKeysOfType', async () => {
    expect(hasKeysOfType({ a: 'a', b: 1 }, { a: 'string' })).toStrictEqual(true)
    expect(hasKeysOfType({ a: 'a', b: 1 }, { b: 'number' })).toStrictEqual(true)
    expect(hasKeysOfType({ a: 'a', b: 1 }, { a: 'string', b: 'number' })).toStrictEqual(true)
    expect(hasKeysOfType({ a: 'a', b: 1 }, {})).toStrictEqual(true)
    expect(hasKeysOfType({}, {})).toStrictEqual(true)

    expect(hasKeysOfType({ a: 'a', b: 1 }, { a: 'number' })).toStrictEqual(false)
    expect(hasKeysOfType({ a: 'a', b: 1 }, { c: 'string' })).toStrictEqual(false)
    expect(hasKeysOfType({ a: 'a', b: 1 }, { a: 'string', b: 'number', c: 'string' })).toStrictEqual(false)

    expect(hasKeysOfType(null, {})).toStrictEqual(false)
    expect(hasKeysOfType(hasKeys, {})).toStrictEqual(false)
    expect(hasKeysOfType(['a', 'b'], {})).toStrictEqual(false)
  })

  test('arrayOfObjectsHasKeys', async () => {
    expect(arrayOfObjectsHasKeys([{ a: 'a', b: 1 }], ['a'])).toStrictEqual(true)
    expect(
      arrayOfObjectsHasKeys(
        [
          { a: 'a', b: 1 },
          { a: 'a', b: 1 },
        ],
        ['a'],
      ),
    ).toStrictEqual(true)
    expect(
      arrayOfObjectsHasKeys(
        [
          { a: 'a', b: 1 },
          { a: 'a', b: 1 },
        ],
        ['b'],
      ),
    ).toStrictEqual(true)
    expect(
      arrayOfObjectsHasKeys(
        [
          { a: 'a', b: 1 },
          { a: 'a', b: 1 },
        ],
        ['a', 'b'],
      ),
    ).toStrictEqual(true)
    expect(
      arrayOfObjectsHasKeys(
        [
          { a: 'a', b: 1 },
          { a: 'a', b: 1 },
        ],
        [],
      ),
    ).toStrictEqual(true)
    expect(arrayOfObjectsHasKeys([{}, {}], [])).toStrictEqual(true)
    expect(
      arrayOfObjectsHasKeys(
        [
          { a: 'a', b: 1 },
          { a: 'a', b: 1 },
        ],
        ['a', 'b', 'a'],
      ),
    ).toStrictEqual(true)
    expect(
      arrayOfObjectsHasKeys(
        [
          { a: 'a', b: 1, x: null },
          { a: 'a', b: 1, y: false },
          { a: 'a', b: 1, z: undefined },
        ],
        ['a', 'b'],
      ),
    ).toStrictEqual(true)
  })
  expect(arrayOfObjectsHasKeys([{ a: 'a' }], ['a'])).toStrictEqual(true)

  expect(arrayOfObjectsHasKeys([{ a: 'a', b: 1 }], ['c'])).toStrictEqual(false)
  expect(arrayOfObjectsHasKeys([{ a: 'a', b: 1 }], ['a', 'b', 'c'])).toStrictEqual(false)
  expect(arrayOfObjectsHasKeys({ a: 'a', b: 1 }, ['a'])).toStrictEqual(false)

  expect(arrayOfObjectsHasKeys(null, [])).toStrictEqual(false)
  expect(arrayOfObjectsHasKeys(hasKeys, [])).toStrictEqual(false)
  expect(arrayOfObjectsHasKeys(['a', 'b'], [])).toStrictEqual(false)
})
