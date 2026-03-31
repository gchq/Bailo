import { setFormDataPropertiesToUndefined } from 'utils/formUtils'
import { describe, expect, it } from 'vitest'

describe('Form utils', () => {
  it('setFormDataPropertiesToUndefined > successfully sets all properties to be undefined whilst retaining original structure', async () => {
    const sourceObject = {
      parent: {
        array: [{ question1: 'Test 1' }, { question2: 'Test 2' }],
        question3: 'Test 3',
      },
    }
    const expectedResult = {
      parent: {
        array: [{ question1: undefined }],
        question3: undefined,
      },
    }
    expect(JSON.stringify(setFormDataPropertiesToUndefined(sourceObject))).toBe(JSON.stringify(expectedResult))
  })
})
