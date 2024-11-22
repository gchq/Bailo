import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/index.js'
import { ModelCardInterface } from '../../../../src/models/Model.js'
import { UserInterface } from '../../../../src/models/User.js'
import { getModelCardHtmlSchema } from '../../../../src/routes/v2/model/modelcard/getModelCardHtml.js'
import { getModelCardHtml as getModelCardHtmlService } from '../../../../src/services/modelCardExport.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')

const mockModelCard: ModelCardInterface = {
  schemaId: 'schema123',
  version: 1,
  createdBy: 'Joe Bloggs',
  metadata: {},
}
const mockUser: UserInterface = { dn: 'user' }

const mockModelCardExportService = vi.hoisted(() => {
  return {
    getModelCardHtml: vi.fn(() => ({ html: 'html', modelCard: mockModelCard })),
  }
})
vi.mock('../../../../src/services/modelCardExport.js', () => mockModelCardExportService)

describe('routes > model > modelcard > getModelCardHtml', () => {
  test('should return html', async () => {
    const fixture = createFixture(getModelCardHtmlSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/${fixture.params.version}/html`)

    expect(getModelCardHtmlService).toHaveBeenCalledWith(mockUser, fixture.params.modelId, fixture.params.version)
    expect(res.statusCode).toBe(200)
    expect(res.text).toBe('html')
  })

  test('should call audit', async () => {
    const fixture = createFixture(getModelCardHtmlSchema)
    await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/${fixture.params.version}/html`)

    expect(audit.onViewModelCard).toHaveBeenCalled()
  })
})
