// @vitest-environment node

import { type StepNoRender } from 'types/types'
import {
  deepMergePreferFirst,
  getFormStats,
  isQuestionAnswered,
  setFormDataPropertiesToUndefined,
  validateForm,
} from 'utils/formUtils'
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

  describe('deepMergePreferFirst', () => {
    it('prefers first object values for primitives', () => {
      const result = deepMergePreferFirst({ a: 'local' }, { a: 'mirrored', b: 'only-mirrored' })
      expect(result).toEqual({ a: 'local', b: 'only-mirrored' })
    })

    it('prefers first object arrays over second', () => {
      const result = deepMergePreferFirst({ tags: ['a'] }, { tags: ['b', 'c'] })
      expect(result).toEqual({ tags: ['a'] })
    })

    it('deeply merges nested objects', () => {
      const result = deepMergePreferFirst(
        { overview: { name: 'local-name' } },
        { overview: { name: 'mirrored-name', description: 'mirrored-desc' } },
      )
      expect(result).toEqual({ overview: { name: 'local-name', description: 'mirrored-desc' } })
    })

    it('fills in missing keys from second object', () => {
      const result = deepMergePreferFirst({}, { a: 'from-mirrored', nested: { b: 'deep' } })
      expect(result).toEqual({ a: 'from-mirrored', nested: { b: 'deep' } })
    })
  })

  describe('getFormStats with mirrored models', () => {
    const baseSchema = {
      title: 'Test',
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name', 'description'],
    }
    const baseStep: StepNoRender = {
      schema: baseSchema,
      state: { name: 'local-name' },
      mirroredState: { description: 'mirrored-desc' },
      index: 0,
      section: 'test',
      type: 'Form',
      schemaRef: 'test',
      shouldValidate: false,
      isComplete: () => false,
    }

    it('counts answers from combined state for mirrored models', () => {
      const stats = getFormStats(baseStep, true)
      expect(stats.totalAnswers).toBe(2)
      expect(stats.formCompleted).toBe(true)
    })

    it('local values take precedence over mirrored values', () => {
      const step: StepNoRender = {
        ...baseStep,
        mirroredState: { name: 'mirrored-name', description: 'mirrored-desc' },
      }
      const stats = getFormStats(step, true)
      expect(stats.totalAnswers).toBe(2)
    })

    it('non-mirrored models only count local state', () => {
      const stats = getFormStats(baseStep, false)
      expect(stats.totalAnswers).toBe(1)
    })
  })

  describe('isQuestionAnswered', () => {
    const makeFormContext = (state: any, mirroredState?: any, mirroredModel = false) =>
      ({ state, mirroredState, mirroredModel }) as any

    it('returns true for answered string field', () => {
      const context = makeFormContext({ overview: { name: 'Test' } })
      expect(isQuestionAnswered('root_overview_name', { type: 'string' }, context)).toBe(true)
    })

    it('returns false for empty string field', () => {
      const context = makeFormContext({ overview: { name: '' } })
      expect(isQuestionAnswered('root_overview_name', { type: 'string' }, context)).toBe(false)
    })

    it('returns false for missing field', () => {
      const context = makeFormContext({})
      expect(isQuestionAnswered('root_overview_name', { type: 'string' }, context)).toBe(false)
    })

    it('falls back to mirrored value when local is empty for mirrored models', () => {
      const context = makeFormContext({ overview: { name: '' } }, { overview: { name: 'Mirrored' } }, true)
      expect(isQuestionAnswered('root_overview_name', { type: 'string' }, context)).toBe(true)
    })

    it('prefers local value over mirrored when both exist', () => {
      const context = makeFormContext({ overview: { name: 'Local' } }, { overview: { name: 'Mirrored' } }, true)
      expect(isQuestionAnswered('root_overview_name', { type: 'string' }, context)).toBe(true)
    })

    it('does not use mirrored value for non-mirrored models', () => {
      const context = makeFormContext({ overview: { name: '' } }, { overview: { name: 'Mirrored' } }, false)
      expect(isQuestionAnswered('root_overview_name', { type: 'string' }, context)).toBe(false)
    })

    it('falls back to mirrored array when local array is empty (DataCardSelector edge case)', () => {
      const context = makeFormContext({ dataCards: [] }, { dataCards: ['card-1', 'card-2'] }, true)
      expect(isQuestionAnswered('root_dataCards', { type: 'array', items: { type: 'string' } }, context)).toBe(true)
    })

    it('returns false when both local and mirrored arrays are empty', () => {
      const context = makeFormContext({ dataCards: [] }, { dataCards: [] }, true)
      expect(isQuestionAnswered('root_dataCards', { type: 'array', items: { type: 'string' } }, context)).toBe(false)
    })
  })

  describe('validateForm', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        count: { type: 'number' },
        reviewDate: { type: 'string', format: 'date' },
        details: {
          type: 'object',
          properties: { owner: { type: 'string' } },
          required: ['owner'],
        },
      },
      required: ['name'],
    }

    const makeStep = (state: unknown, stepSchema: unknown = schema) =>
      ({ schema: stepSchema, state }) as unknown as StepNoRender

    it('returns true when the state matches the schema', () => {
      expect(
        validateForm(makeStep({ name: 'Model', count: 3, reviewDate: '2026-11-12', details: { owner: 'a' } })),
      ).toBe(true)
    })

    it('returns false when a required property is missing', () => {
      expect(validateForm(makeStep({ count: 3 }))).toBe(false)
    })

    it('returns false when a nested required property is missing', () => {
      expect(validateForm(makeStep({ name: 'Model', details: {} }))).toBe(false)
    })

    it('returns false when a property has the wrong type', () => {
      expect(validateForm(makeStep({ name: 'Model', count: 'three' }))).toBe(false)
    })

    it('returns false when a string does not meet a constraint', () => {
      expect(validateForm(makeStep({ name: '' }))).toBe(false)
    })

    it('returns false when a date property has an invalid format', () => {
      expect(validateForm(makeStep({ name: 'Model', reviewDate: 'not a date' }))).toBe(false)
    })

    it('returns true for an empty schema', () => {
      expect(validateForm(makeStep({ anything: 'goes' }, {}))).toBe(true)
    })

    it('ignores unknown schema keywords', () => {
      const schemaWithCustomKeyword = { ...schema, widget: 'customWidget' }
      expect(validateForm(makeStep({ name: 'Model' }, schemaWithCustomKeyword))).toBe(true)
    })
  })
})
