import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModelInterface } from '../../src/models/Model.js'
import { ModelCardRevisionInterface } from '../../src/models/ModelCardRevision.js'
import { getModelById } from '../../src/services/model.js'
import { renderToHtml, renderToMarkdown } from '../../src/services/modelCardExport.js'
import { getSchemaById } from '../../src/services/schema.js'

vi.mock('../../src/services/model.js')
vi.mock('../../src/services/schema.js')

describe('services > export', () => {
  const mockModelId = 'model123'
  const mockSchemaId = 'schema123'
  const mockModel = { name: 'Test Model', description: 'Test Description', card: {} }
  const mockModelCardRevision: ModelCardRevisionInterface = {
    modelId: mockModelId,
    schemaId: mockSchemaId,
    version: 1,
    createdBy: 'Joe Bloggs',
    metadata: {},
  }
  const mockSchema = { jsonSchema: { type: 'object', properties: {} } }

  beforeEach(() => {
    vi.mocked(getModelById).mockResolvedValue(mockModel as any)
    vi.mocked(getSchemaById).mockResolvedValue(mockSchema as any)
  })

  test('renderToMarkdown > should return markdown', async () => {
    const result = await renderToMarkdown(mockModel as ModelInterface, mockModelCardRevision)

    expect(result).toContain('> Test Description')
  })

  test('renderToHtml > should throw error if model has no card', async () => {
    await expect(
      renderToHtml({ ...mockModel, card: undefined } as ModelInterface, mockModelCardRevision),
    ).rejects.toThrow('Trying to export model with no corresponding card')
  })

  test('renderToHtml > should throw error if schema is not found', async () => {
    vi.mocked(getSchemaById).mockResolvedValueOnce(undefined as any)

    await expect(renderToHtml(mockModel as ModelInterface, mockModelCardRevision)).rejects.toThrow(
      'Trying to export model with no corresponding card',
    )
  })

  test('renderToHtml > should return html', async () => {
    const result = await renderToHtml(mockModel as ModelInterface, mockModelCardRevision)

    expect(result).toContain('<p>Test Description</p>')
  })
})
