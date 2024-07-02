import { describe, expect, test, vi } from 'vitest'
import { Request, Response } from 'express'
import { getModelCardHtml } from '../../../../src/routes/v2/model/modelcard/getModelCardHtml.js'
import { renderToHtml } from '../../../../src/services/export.js'
import audit from '../../../../src/connectors/audit/index.js'

vi.mock('../../../../src/services/export.js')
vi.mock('../../../../src/connectors/audit/index.js')

describe('routes > modelcard > getModelCardHtml', () => {
  const mockUser = { dn: 'testUser' } as any
  const mockModelId = '123'
  const mockVersion = 1
  const mockHtml = '<html><body>Test HTML</body></html>'
  const mockCard = { schemaId: 'schema123', metadata: {} }

  const req = {
    user: mockUser,
    params: { modelId: mockModelId, version: mockVersion },
    audit: {},
  } as unknown as Request

  const res = {
    send: vi.fn(),
  } as unknown as Response

  beforeEach(() => {
    vi.mocked(renderToHtml).mockResolvedValue({ html: mockHtml, card: mockCard })
  })

  test('should return HTML and call audit', async () => {
    await getModelCardHtml[1](req, res)

    expect(renderToHtml).toHaveBeenCalledWith(mockUser, mockModelId, mockVersion)
    expect(audit.onViewModelCard).toHaveBeenCalledWith(req, mockModelId, mockCard)
    expect(res.send).toHaveBeenCalledWith(mockHtml)
  })

  test('should set audit info', async () => {
    await getModelCardHtml[1](req, res)

    expect(req.audit).toEqual({ typeId: 'ViewModelCard', description: 'View model card', auditKind: 'view' })
  })
})
