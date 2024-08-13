import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getModelById, getModelCard } from '../../src/services/model.js'
import { renderToHtml, renderToMarkdown } from '../../src/services/modelCardExport.js'
import { findSchemaById } from '../../src/services/schema.js'

vi.mock('../../src/services/model.js')
vi.mock('../../src/services/schema.js')

describe('services > export', () => {
  const mockUser = { dn: 'testUser' } as any
  const mockModelId = '123'
  const mockVersion = 1
  const mockModel = { name: 'Test Model', description: 'Test Description', card: true }
  const mockCard = { schemaId: 'schema123', metadata: {} }
  const mockSchema = { jsonSchema: { type: 'object', properties: {} } }

  beforeEach(() => {
    vi.mocked(getModelById).mockResolvedValue(mockModel as any)
    vi.mocked(getModelCard).mockResolvedValue(mockCard as any)
    vi.mocked(findSchemaById).mockResolvedValue(mockSchema as any)
  })

  test('renderToMarkdown > should throw error if model has no card', async () => {
    vi.mocked(getModelById).mockResolvedValueOnce({ ...mockModel, card: false } as any)

    await expect(renderToMarkdown(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      'Trying to export model with no corresponding card',
    )
  })

  test('renderToMarkdown > should throw error if card is not found', async () => {
    vi.mocked(getModelCard).mockResolvedValueOnce(undefined as any)

    await expect(renderToMarkdown(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      'Could not find specified model card',
    )
  })

  test('renderToMarkdown > should throw error if schema is not found', async () => {
    vi.mocked(findSchemaById).mockResolvedValueOnce(undefined as any)

    await expect(renderToMarkdown(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      'Trying to export model with no corresponding card',
    )
  })

  test('renderToMarkdown > should return markdown and card', async () => {
    const result = await renderToMarkdown(mockUser, mockModelId, mockVersion)

    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('card', mockCard)
  })

  test('renderToHtml > should return html and card', async () => {
    const result = await renderToHtml(mockUser, mockModelId, mockVersion)

    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('card', mockCard)
  })
})
