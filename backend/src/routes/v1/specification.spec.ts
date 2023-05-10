import { describe, test } from 'vitest'

import { generateSpecification } from './specification.js'

describe('test specification generation', () => {
  test('that we generate a valid specificaiton', async () => {
    generateSpecification()
  })
})
