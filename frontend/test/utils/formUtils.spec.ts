import { RJSFValidationError } from '@rjsf/utils'
import { StepNoRender } from 'types/types'
import {
  deepMergePreferFirst,
  getErrorLabel,
  getFormStats,
  getPathFromId,
  getStepsFromSchema,
  isQuestionAnswered,
  REQUIRED_FIELD_MESSAGE,
  setFormDataPropertiesToUndefined,
  transformErrors,
  validateForm,
  validateStep,
} from 'utils/formUtils'
import { testAccessRequestSchema } from 'utils/test/testModels'
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

  describe('validateStep', () => {
    const schema = {
      type: 'object',
      required: ['name', 'deployment'],
      properties: {
        name: { title: 'Name of Deployment', type: 'string' },
        deployment: {
          type: 'object',
          required: ['status'],
          properties: { status: { title: 'Status', type: 'string' } },
        },
        tags: { type: 'array', maxItems: 2, items: { type: 'string' } },
      },
    }

    const makeStep = (state: unknown, stepSchema: unknown = schema): StepNoRender =>
      ({
        schema: stepSchema,
        state,
        index: 0,
        type: 'Form',
        section: 'overview',
        schemaRef: 'test-schema',
        isComplete: () => false,
      }) as StepNoRender

    const errorsByProperty = (step: StepNoRender) =>
      new Map(validateStep(step).errors.map((error) => [error.property, error.message]))

    it('attaches a missing top level required field to the field itself', () => {
      // RJSF omits the leading dot for a property at the root of the step
      expect(errorsByProperty(makeStep({ deployment: { status: 'Live' } })).get('name')).toBe(REQUIRED_FIELD_MESSAGE)
    })

    it('attaches a missing nested required field to the leaf, not its parent', () => {
      const errors = errorsByProperty(makeStep({ name: 'A deployment', deployment: {} }))
      expect(errors.get('.deployment.status')).toBe(REQUIRED_FIELD_MESSAGE)
      expect(errors.has('.deployment')).toBe(false)
    })

    it('treats an empty string as an unanswered required field', () => {
      const errors = errorsByProperty(makeStep({ name: '', deployment: { status: 'Live' }, tags: ['a'] }))
      expect(errors.get('.name')).toBe(REQUIRED_FIELD_MESSAGE)
    })

    it('reports the cleared leaf of a nested answer rather than its parent', () => {
      const errors = errorsByProperty(makeStep({ name: 'A deployment', deployment: { status: '' } }))
      expect(errors.get('.deployment.status')).toBe(REQUIRED_FIELD_MESSAGE)
      expect(errors.has('.deployment')).toBe(false)
    })

    it('reports the cleared leaf of an array item rather than the array itself', () => {
      const ownersSchema = {
        type: 'object',
        required: ['owners'],
        properties: {
          owners: {
            type: 'array',
            items: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
          },
        },
      }

      const errors = errorsByProperty(makeStep({ owners: [{ name: '' }] }, ownersSchema))
      expect(errors.get('.owners.0.name')).toBe(REQUIRED_FIELD_MESSAGE)
      expect(errors.has('.owners')).toBe(false)
    })

    it('keeps AJV wording for an answered field breaching a constraint', () => {
      const errors = errorsByProperty(
        makeStep({ name: 'A deployment', deployment: { status: 'Live' }, tags: ['a', 'b', 'c', 'd'] }),
      )
      expect(errors.get('.tags')).toBe('must NOT have more than 2 items')
    })

    it('keeps AJV wording for a wrong-typed answer', () => {
      const errors = errorsByProperty(makeStep({ name: 42, deployment: { status: 'Live' } }))
      expect(errors.get('.name')).toBe('must be string')
    })
  })

  describe('validateForm', () => {
    const schema = {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string' } },
    }

    const makeStep = (state: unknown, stepSchema: unknown = schema): StepNoRender =>
      ({
        schema: stepSchema,
        state,
        index: 0,
        type: 'Form',
        section: 'overview',
        schemaRef: 'test-schema',
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

    it.each([[[]], [['']], [['', '']]])('rejects a required array cleared to %j', (tags) => {
      const tagsSchema = {
        type: 'object',
        required: ['tags'],
        properties: { tags: { type: 'array', items: { type: 'string' } } },
      }

      expect(validateForm(makeStep({ tags }, tagsSchema))).toBe(false)
    })

    it('accepts a required array with an answered item', () => {
      const tagsSchema = {
        type: 'object',
        required: ['tags'],
        properties: { tags: { type: 'array', items: { type: 'string' } } },
      }

      expect(validateForm(makeStep({ tags: ['a'] }, tagsSchema))).toBe(true)
    })

    it('accepts a real Bailo schema, which uses definitions and custom keywords', () => {
      const [step] = getStepsFromSchema(testAccessRequestSchema, {}, [], {
        overview: { name: 'An access request' },
      })

      expect(validateForm(step)).toBe(true)
    })
  })

  describe('transformErrors', () => {
    const error = (overrides: Partial<RJSFValidationError>): RJSFValidationError =>
      ({
        name: 'required',
        property: '.overview.name',
        message: "must have required property 'Name'",
        ...overrides,
      }) as RJSFValidationError

    it('rewrites the message of a missing field', () => {
      const [transformed] = transformErrors([error({ title: 'Name of Deployment' })])

      expect(transformed.message).toBe(REQUIRED_FIELD_MESSAGE)
    })

    it('leaves other keywords untouched', () => {
      const constraint = error({ name: 'maxItems', message: 'must NOT have more than 2 items' })
      const [transformed] = transformErrors([constraint])

      expect(transformed).toEqual(constraint)
    })
  })

  describe('getErrorLabel', () => {
    const schema = {
      type: 'object',
      properties: { overview: { type: 'object', properties: { modelIds: { title: 'Related models' } } } },
    }

    it('prefers the title RJSF resolved', () => {
      expect(getErrorLabel({ title: 'Name of Deployment', property: '.overview.name' } as RJSFValidationError)).toBe(
        'Name of Deployment',
      )
    })

    it('falls back to the question in the schema', () => {
      expect(getErrorLabel({ property: '.overview.modelIds' } as RJSFValidationError, schema)).toBe('Related models')
    })

    it('falls back to the field name when the schema has no question', () => {
      expect(getErrorLabel({ property: '.overview.modelIds' } as RJSFValidationError)).toBe('Model Ids')
    })

    it('handles an error with no property', () => {
      expect(getErrorLabel({} as RJSFValidationError)).toBe('This field')
    })
  })
})
