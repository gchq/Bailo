import { describe, expect, test, vi } from 'vitest'
import { readFile } from 'fs/promises'
import showdown from 'showdown'
import { renderToMarkdown, renderToHtml } from '../../src/services/export'
import { getModelById, getModelCard } from '../../src/services/model'
import { findSchemaById } from '../../src/services/schema'

vi.mock('fs/promises')
vi.mock('showdown')
vi.mock('../../src/services/model')
vi.mock('../../src/services/schema')

describe('services > export', () => {
  const mockUser = { dn: 'testUser' } as any
  const mockModelId = '123'
  const mockVersion = 1
  const mockModel = { name: 'Test Model', description: 'Test Description', card: true }
  const mockCard = { schemaId: 'schema123', metadata: {} }
  const mockSchema = { jsonSchema: { type: 'object', properties: {} } }

  beforeEach(() => {
    vi.mocked(getModelById).mockResolvedValue(mockModel)
    vi.mocked(getModelCard).mockResolvedValue(mockCard)
    vi.mocked(findSchemaById).mockResolvedValue(mockSchema)
  })

  test('renderToMarkdown > should throw error if model has no card', async () => {
    vi.mocked(getModelById).mockResolvedValueOnce({ ...mockModel, card: false })

    await expect(renderToMarkdown(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      'Trying to export model with no corresponding card',
    )
  })

  test('renderToMarkdown > should throw error if card is not found', async () => {
    vi.mocked(getModelCard).mockResolvedValueOnce(undefined)

    await expect(renderToMarkdown(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      'Could not find specified model card',
    )
  })

  test('renderToMarkdown > should throw error if schema is not found', async () => {
    vi.mocked(findSchemaById).mockResolvedValueOnce(undefined)

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
    const mockMarkdown = '# Test Model\n> Test Description\n'
    const mockHtml = '<h1>Test Model</h1><blockquote><p>Test Description</p></blockquote>'
    vi.mocked(renderToMarkdown).mockResolvedValueOnce({ markdown: mockMarkdown, card: mockCard })
    vi.mocked(showdown.Converter.prototype.makeHtml).mockReturnValue(mockHtml)
    vi.mocked(readFile).mockResolvedValue('')

    const result = await renderToHtml(mockUser, mockModelId, mockVersion)

    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('card', mockCard)
  })
})
