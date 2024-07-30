import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/index.js'
import { UserInterface } from '../../../../src/models/User.js'
import { getModelCardHtmlSchema } from '../../../../src/routes/v2/model/modelcard/getModelCardHtml.js'
import { renderToHtml } from '../../../../src/services/modelCardExport.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')

const mockModelCardExportService = vi.hoisted(() => {
  return {
    renderToHtml: vi.fn(() => ({ html: 'test', card: 'card' })),
  }
})
vi.mock('../../../../src/services/modelCardExport.js', () => mockModelCardExportService)

describe('routes > model > modelcard > getModelCardHtml', () => {
  test('should return HTML and call audit', async () => {
    const testUser = { dn: 'user' } as UserInterface
    mockModelCardExportService.renderToHtml.mockResolvedValueOnce({ html: 'test', card: 'card' })

    const fixture = createFixture(getModelCardHtmlSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/${fixture.params.version}/html`)

    expect(renderToHtml).toHaveBeenCalledWith(testUser, fixture.params.modelId, fixture.params.version)
    expect(res.statusCode).toBe(200)
    expect(res.text).toBe('test')
    expect(audit.onViewModelCard).toHaveBeenCalled()
  })
})
