import { describe, expect, test, vi } from 'vitest'

import {
  buildSchemaDescription,
  cleanArrayItems,
  cleanStringValue,
  extractModelCardFromText,
  isInvalidDateString,
  isPlaceholderUrl,
} from '../../src/services/modelCardImport.js'

const llmMock = vi.hoisted(() => ({
  callLlmChatCompletion: vi.fn(),
  ChatMessageRole: {
    SYSTEM: 'system',
    USER: 'user',
    ASSISTANT: 'assistant',
  },
}))
vi.mock('../../src/clients/llm.js', () => llmMock)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', () => modelMock)

const schemaMock = vi.hoisted(() => ({
  getSchemaById: vi.fn(),
}))
vi.mock('../../src/services/schema.js', () => schemaMock)

vi.mock('../../src/services/log.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../src/utils/config.js', () => ({
  default: {
    llm: {
      systemPrompt: 'Test system prompt',
    },
  },
}))

describe('services > modelCardImport', () => {
  const testUser = { dn: 'user' } as any

  describe('buildSchemaDescription', () => {
    test('returns empty array for non-object schema', () => {
      expect(buildSchemaDescription({ type: 'string' })).toEqual([])
    })

    test('returns empty array for object schema with no properties', () => {
      expect(buildSchemaDescription({ type: 'object' })).toEqual([])
    })

    test('extracts simple string field', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Model Name' },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([{ path: 'name', title: 'Model Name', type: 'string' }])
    })

    test('extracts number and boolean fields', () => {
      const schema = {
        type: 'object',
        properties: {
          accuracy: { type: 'number', title: 'Accuracy' },
          approved: { type: 'boolean', title: 'Approved' },
        },
      }
      const result = buildSchemaDescription(schema)
      expect(result).toEqual([
        { path: 'accuracy', title: 'Accuracy', type: 'number' },
        { path: 'approved', title: 'Approved', type: 'boolean' },
      ])
    })

    test('uses key as title when title is not provided', () => {
      const schema = {
        type: 'object',
        properties: {
          version: { type: 'string' },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([{ path: 'version', title: 'version', type: 'string' }])
    })

    test('includes description when present', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name', description: 'The model name' },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([
        { path: 'name', title: 'Name', type: 'string', description: 'The model name' },
      ])
    })

    test('includes format when present', () => {
      const schema = {
        type: 'object',
        properties: {
          createdAt: { type: 'string', title: 'Created', format: 'date' },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([
        { path: 'createdAt', title: 'Created', type: 'string (format: date)', format: 'date' },
      ])
    })

    test('handles nested objects recursively', () => {
      const schema = {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              name: { type: 'string', title: 'Name' },
            },
          },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([{ path: 'overview.name', title: 'Name', type: 'string' }])
    })

    test('handles deeply nested objects with basePath', () => {
      const schema = {
        type: 'object',
        properties: {
          inner: {
            type: 'object',
            properties: {
              value: { type: 'string', title: 'Value' },
            },
          },
        },
      }
      expect(buildSchemaDescription(schema, 'root')).toEqual([
        { path: 'root.inner.value', title: 'Value', type: 'string' },
      ])
    })

    test('handles array of strings', () => {
      const schema = {
        type: 'object',
        properties: {
          tags: { type: 'array', title: 'Tags', items: { type: 'string' } },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([{ path: 'tags', title: 'Tags', type: 'array of string' }])
    })

    test('handles array of objects with sub-fields', () => {
      const schema = {
        type: 'object',
        properties: {
          authors: {
            type: 'array',
            title: 'Authors',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      }
      const result = buildSchemaDescription(schema)
      expect(result).toEqual([
        { path: 'authors', title: 'Authors', type: 'array of objects with fields: { name: string, email: string }' },
      ])
    })

    test('handles array with enum items', () => {
      const schema = {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            title: 'Categories',
            items: { type: 'string', enum: ['nlp', 'vision', 'audio'] },
          },
        },
      }
      const result = buildSchemaDescription(schema)
      expect(result).toEqual([
        {
          path: 'categories',
          title: 'Categories',
          type: 'array of string, allowed values: ["nlp", "vision", "audio"]',
        },
      ])
    })

    test('resolves $ref and includes enum values in description', () => {
      const schema = {
        type: 'object',
        definitions: {
          securityClassification: { type: 'string', enum: ['OFFICIAL', 'OFFICIAL SENSITIVE'] },
        },
        properties: {
          classification: { title: 'Classification', $ref: '#/definitions/securityClassification' },
        },
      }
      const result = buildSchemaDescription(schema)
      expect(result).toEqual([
        {
          path: 'classification',
          title: 'Classification',
          type: 'string, allowed values: ["OFFICIAL", "OFFICIAL SENSITIVE"]',
        },
      ])
    })

    test('resolves $ref for array items', () => {
      const schema = {
        type: 'object',
        definitions: {
          status: { type: 'string', enum: ['active', 'retired'] },
        },
        properties: {
          statuses: { type: 'array', title: 'Statuses', items: { $ref: '#/definitions/status' } },
        },
      }
      const result = buildSchemaDescription(schema)
      expect(result).toEqual([
        {
          path: 'statuses',
          title: 'Statuses',
          type: 'array of string, allowed values: ["active", "retired"]',
        },
      ])
    })

    test('includes enum values for inline enum fields', () => {
      const schema = {
        type: 'object',
        properties: {
          priority: { type: 'string', title: 'Priority', enum: ['low', 'medium', 'high'] },
        },
      }
      const result = buildSchemaDescription(schema)
      expect(result).toEqual([
        {
          path: 'priority',
          title: 'Priority',
          type: 'string, allowed values: ["low", "medium", "high"]',
        },
      ])
    })

    test('skips fields with excluded widgets', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          selector: { type: 'string', title: 'Selector', widget: 'dataCardSelector' },
          entity: { type: 'string', title: 'Entity', widget: 'entitySelector' },
        },
      }
      expect(buildSchemaDescription(schema)).toEqual([{ path: 'name', title: 'Name', type: 'string' }])
    })
  })

  describe('extractModelCardFromText', () => {
    const minimalJsonSchema = {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name' },
            description: { type: 'string', title: 'Description' },
          },
        },
      },
    }

    test('throws when model has no schemaId', async () => {
      modelMock.getModelById.mockResolvedValueOnce({ card: {} })

      await expect(extractModelCardFromText(testUser, 'model-1', 'some text')).rejects.toThrow(
        /select a schema before importing/,
      )
    })

    test('throws when model has no card', async () => {
      modelMock.getModelById.mockResolvedValueOnce({})

      await expect(extractModelCardFromText(testUser, 'model-1', 'some text')).rejects.toThrow(
        /select a schema before importing/,
      )
    })

    test('calls LLM and returns cleaned data', async () => {
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: minimalJsonSchema })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(
        JSON.stringify({ overview: { name: 'Test Model', description: 'A test model' } }),
      )

      const result = await extractModelCardFromText(testUser, 'model-1', 'My model is called Test Model')

      expect(llmMock.callLlmChatCompletion).toHaveBeenCalledOnce()
      expect(result.metadata).toEqual({ overview: { name: 'Test Model', description: 'A test model' } })
      expect(result.warnings).toEqual([])
    })

    test('throws when LLM returns invalid JSON', async () => {
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: minimalJsonSchema })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce('not valid json {{{')

      await expect(extractModelCardFromText(testUser, 'model-1', 'some text')).rejects.toThrow(
        /LLM returned invalid JSON/,
      )
    })

    test('strips keys not present in schema', async () => {
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: minimalJsonSchema })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(
        JSON.stringify({
          overview: { name: 'Test', description: 'Desc', unknownField: 'should be removed' },
          nonExistentSection: { data: 'gone' },
        }),
      )

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata).toEqual({ overview: { name: 'Test', description: 'Desc' } })
      expect((result.metadata as any).nonExistentSection).toBeUndefined()
      expect((result.metadata as any).overview?.unknownField).toBeUndefined()
    })

    test('strips placeholder values like N/A and example URLs', async () => {
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: minimalJsonSchema })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(
        JSON.stringify({
          overview: { name: 'N/A', description: 'https://example.com/placeholder' },
        }),
      )

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata).toEqual({})
    })

    test('strips fields with excluded widgets', async () => {
      const schemaWithWidget = {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              name: { type: 'string', title: 'Name' },
              selector: { type: 'string', title: 'Selector', widget: 'dataCardSelector' },
            },
          },
        },
      }
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: schemaWithWidget })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(
        JSON.stringify({ overview: { name: 'Test', selector: 'should be stripped' } }),
      )

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata).toEqual({ overview: { name: 'Test' } })
    })

    test('handles enum validation by stripping invalid enum values', async () => {
      const schemaWithEnum = {
        type: 'object',
        properties: {
          status: { type: 'string', title: 'Status', enum: ['draft', 'published'] },
        },
      }
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: schemaWithEnum })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(JSON.stringify({ status: 'invalid_value' }))

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata.status).toBeUndefined()
    })

    test('matches enum values case-insensitively and returns the schema-defined casing', async () => {
      const schemaWithEnum = {
        type: 'object',
        properties: {
          status: { type: 'string', title: 'Status', enum: ['Draft', 'Published'] },
        },
      }
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: schemaWithEnum })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(JSON.stringify({ status: 'published' }))

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata.status).toBe('Published')
    })

    test('matches array enum values case-insensitively', async () => {
      const schemaWithArrayEnum = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string', enum: ['NLP', 'Vision', 'Audio'] },
          },
        },
      }
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: schemaWithArrayEnum })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(JSON.stringify({ tags: ['nlp', 'VISION', 'invalid'] }))

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata.tags).toEqual(['NLP', 'Vision'])
    })

    test('truncates strings exceeding maxLength', async () => {
      const schemaWithMaxLength = {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name', maxLength: 5 },
        },
      }
      modelMock.getModelById.mockResolvedValueOnce({ card: { schemaId: 'schema-1' } })
      schemaMock.getSchemaById.mockResolvedValueOnce({ jsonSchema: schemaWithMaxLength })
      llmMock.callLlmChatCompletion.mockResolvedValueOnce(JSON.stringify({ name: 'Too Long String' }))

      const result = await extractModelCardFromText(testUser, 'model-1', 'some text')

      expect(result.metadata.name).toBe('Too L')
    })
  })

  describe('isPlaceholderUrl', () => {
    test('detects example.com URLs', () => {
      expect(isPlaceholderUrl('https://example.com')).toBe(true)
      expect(isPlaceholderUrl('http://example.com/path')).toBe(true)
    })

    test('detects www.example URLs', () => {
      expect(isPlaceholderUrl('https://www.example.org/test')).toBe(true)
    })

    test('detects placeholder URLs', () => {
      expect(isPlaceholderUrl('https://placeholder.com/image')).toBe(true)
      expect(isPlaceholderUrl('https://your-website.com')).toBe(true)
      expect(isPlaceholderUrl('https://insert-url-here.com')).toBe(true)
      expect(isPlaceholderUrl('https://link-here.com')).toBe(true)
    })

    test('allows legitimate URLs', () => {
      expect(isPlaceholderUrl('https://github.com/repo')).toBe(false)
      expect(isPlaceholderUrl('https://huggingface.co/model')).toBe(false)
      expect(isPlaceholderUrl('https://arxiv.org/abs/1234')).toBe(false)
    })
  })

  describe('isInvalidDateString', () => {
    test('detects invalid date strings', () => {
      expect(isInvalidDateString('0000-00-00')).toBe(true)
    })

    test('allows valid date strings', () => {
      expect(isInvalidDateString('2024-01-15')).toBe(false)
      expect(isInvalidDateString('2023-12-31')).toBe(false)
    })

    test('returns false for non-date strings', () => {
      expect(isInvalidDateString('not a date')).toBe(false)
      expect(isInvalidDateString('2024-1-1')).toBe(false)
      expect(isInvalidDateString('')).toBe(false)
    })
  })

  describe('cleanArrayItems', () => {
    const emptyRoot = { type: 'object', properties: {} }

    test('filters out items not matching enum values', () => {
      const itemSchema = { type: 'string', enum: ['NLP', 'Vision'] }
      const result = cleanArrayItems(['NLP', 'invalid', 'Vision'], 'tags', itemSchema, emptyRoot)
      expect(result).toEqual(['NLP', 'Vision'])
    })

    test('matches enum values case-insensitively', () => {
      const itemSchema = { type: 'string', enum: ['NLP', 'Vision'] }
      const result = cleanArrayItems(['nlp', 'VISION'], 'tags', itemSchema, emptyRoot)
      expect(result).toEqual(['NLP', 'Vision'])
    })

    test('filters out placeholder values', () => {
      const itemSchema = { type: 'string' }
      const result = cleanArrayItems(['valid text', 'N/A', 'not specified'], 'items', itemSchema, emptyRoot)
      expect(result).toEqual(['valid text'])
    })

    test('filters out null and undefined values', () => {
      const itemSchema = { type: 'string' }
      const result = cleanArrayItems(['valid', null, undefined, 'also valid'], 'items', itemSchema, emptyRoot)
      expect(result).toEqual(['valid', 'also valid'])
    })

    test('passes through items when no item schema is provided', () => {
      const result = cleanArrayItems(['a', 'b', 'c'], 'items', undefined, emptyRoot)
      expect(result).toEqual(['a', 'b', 'c'])
    })
  })

  describe('cleanStringValue', () => {
    test('truncates strings exceeding maxLength', () => {
      const schema = { type: 'string', maxLength: 5 }
      expect(cleanStringValue('Too Long String', 'name', schema)).toBe('Too L')
    })

    test('returns string unchanged when within maxLength', () => {
      const schema = { type: 'string', maxLength: 100 }
      expect(cleanStringValue('short', 'name', schema)).toBe('short')
    })

    test('matches enum values case-insensitively', () => {
      const schema = { type: 'string', enum: ['Draft', 'Published'] }
      expect(cleanStringValue('published', 'status', schema)).toBe('Published')
    })

    test('returns undefined for unmatched enum values', () => {
      const schema = { type: 'string', enum: ['Draft', 'Published'] }
      expect(cleanStringValue('invalid', 'status', schema)).toBeUndefined()
    })

    test('passes through plain strings unchanged', () => {
      const schema = { type: 'string' }
      expect(cleanStringValue('hello world', 'name', schema)).toBe('hello world')
    })
  })
})
