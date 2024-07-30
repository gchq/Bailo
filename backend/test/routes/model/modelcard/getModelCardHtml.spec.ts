import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/index.js'
import { getModelCardHtmlSchema } from '../../../../src/routes/v2/model/modelcard/getModelCardHtml.js'
import { renderToHtml } from '../../../../src/services/modelCardExport.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')

describe('routes > model > modelcard > getModelCardHtml', () => {
  test('should return HTML and call audit', async () => {
    const html = { html: 'test', card: 'card' }
    vi.mock('../../../src/services/modelCardExport.js', () => ({
      renderToHtml: vi.fn(() => html),
    }))

    const fixture = createFixture(getModelCardHtmlSchema)
    await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/${fixture.params.version}/html`)

    expect(renderToHtml).toHaveBeenCalledWith(undefined, fixture.params.modelId, fixture.params.version)
    expect(audit.onViewModelCard).toHaveBeenCalled()
  })
})
