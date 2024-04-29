import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postRequestExportToS3Schema } from '../../../src/routes/v2/model/postRequestExport.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/mirroredModel.js', () => ({
      exportModel: vi.fn(),
    }))

    const fixture = createFixture(postRequestExportToS3Schema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/export/s3`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      createModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postRequestExportToS3Schema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/export/s3`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateS3Export).toBeCalled()
    expect(audit.onCreateS3Export.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
