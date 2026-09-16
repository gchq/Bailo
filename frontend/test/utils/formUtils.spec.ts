import { StepNoRender } from 'types/types'
import {
  deepMergePreferFirst,
  getFormStats,
  getInvalidFields,
  getPathFromId,
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

  describe('getPathFromId', () => {
    it('strips the root prefix', () => {
      expect(getPathFromId('root_name')).toEqual(['name'])
    })

    it('splits nested fields', () => {
      expect(getPathFromId('root_deployment_status')).toEqual(['deployment', 'status'])
    })

    it('keeps array indices as segments', () => {
      expect(getPathFromId('root_entities_0_name')).toEqual(['entities', '0', 'name'])
    })

    it('returns an empty path for the root itself', () => {
      expect(getPathFromId('root')).toEqual(['root'])
      expect(getPathFromId('root_')).toEqual([])
    })
  })

  describe('getInvalidFields', () => {
    const schema = {
      type: 'object',
      required: ['name', 'deployment'],
      properties: {
        name: { type: 'string' },
        deployment: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string' } },
        },
        tags: { type: 'array', maxItems: 2, items: { type: 'string' } },
      },
    }

    const makeStep = (state: unknown): StepNoRender =>
      ({
        schema,
        state,
        index: 0,
        type: 'Form',
        section: 'overview',
        schemaRef: 'test-schema',
        shouldValidate: false,
        isComplete: () => false,
      }) as StepNoRender

    it('returns the path of a missing top level required field', () => {
      const fields = getInvalidFields(makeStep({ deployment: { status: 'Live' } }))
      expect(fields.get('name')).toBe('This field is required')
    })

    it('returns the path of a missing nested required field', () => {
      const fields = getInvalidFields(makeStep({ name: 'A deployment', deployment: {} }))
      expect(fields.get('deployment.status')).toBe('This field is required')
    })

    it('treats an empty string as an unanswered required field', () => {
      const fields = getInvalidFields(makeStep({ name: '', deployment: { status: 'Live' }, tags: ['a'] }))
      expect(fields.get('name')).toBe('This field is required')
    })

    it('marks the offending leaf rather than its parent when a nested answer is cleared', () => {
      const fields = getInvalidFields(makeStep({ name: 'A deployment', deployment: { status: '' } }))
      expect(fields.get('deployment.status')).toBe('This field is required')
      expect(fields.has('deployment')).toBe(false)
    })

    it('reports an answered field breaching a constraint as invalid rather than missing', () => {
      const fields = getInvalidFields(
        makeStep({ name: 'A deployment', deployment: { status: 'Live' }, tags: ['a', 'b', 'c', 'd'] }),
      )
      expect(fields.get('tags')).toBe('This field has an invalid value')
    })

    it('reports a wrong-typed answer as invalid rather than missing', () => {
      const fields = getInvalidFields(makeStep({ name: 42, deployment: { status: 'Live' } }))
      expect(fields.get('name')).toBe('This field has an invalid value')
    })

    it('returns no fields when the step is complete', () => {
      const fields = getInvalidFields(makeStep({ name: 'A deployment', deployment: { status: 'Live' }, tags: ['a'] }))
      expect(fields.size).toBe(0)
    })
  })

  describe('validateForm', () => {
    const schema = {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string' } },
    }

    const makeStep = (state: unknown): StepNoRender =>
      ({
        schema,
        state,
        index: 0,
        type: 'Form',
        section: 'overview',
        schemaRef: 'test-schema',
        shouldValidate: false,
        isComplete: () => false,
      }) as StepNoRender

    it('accepts a completed step', () => {
      expect(validateForm(makeStep({ name: 'A deployment' }))).toBe(true)
    })

    it('rejects a required field cleared back to an empty string', () => {
      expect(validateForm(makeStep({ name: '' }))).toBe(false)
    })

    it('rejects a missing required field', () => {
      expect(validateForm(makeStep({}))).toBe(false)
    })
  })
})
