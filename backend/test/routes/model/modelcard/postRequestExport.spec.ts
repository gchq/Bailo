import { describe, expect, test, vi } from 'vitest'

import { postRequestExportSchema } from '../../../../src/routes/v2/model/modelcard/postRequestExport.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/authorisation/index.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/mirroredModel.js', () => ({
  exportModelCardRevisions: vi.fn(),
}))

describe('routes > model > modelcard > postRequestExport', () => {
  test('200 > ok', async () => {
    const res = await testPost('/api/v2/model/example/model-card-revisions/export', {
      body: { disclaimerAgreement: true },
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('400 > no description', async () => {
    const fixture = createFixture(postRequestExportSchema) as any

    // This model does not include a description.
    delete fixture.body.disclaimerAgreement

    const res = await testPost('/api/v2/model/example/model-card-revisions/export', fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
