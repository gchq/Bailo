import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postRequestImportFromS3Schema } from '../../../src/routes/v2/model/postRequestImport.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > postRequestImport', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/mirroredModel.js', () => ({
      ImportKind: { Documents: 'documents', File: 'file' } as const,
      importModel: vi.fn(() => ({
        mirroredModel: { id: 'abc' },
        sourceModelId: 'cba',
        modelCardVersions: [1, 2, 3],
        newModelCards: [],
      })),
    }))

    const fixture = createFixture(postRequestImportFromS3Schema)
    const res = await testPost(`/api/v2/model/import/s3`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      createModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postRequestImportFromS3Schema)
    const res = await testPost(`/api/v2/model/import/s3`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateImport).toBeCalled()
    expect(audit.onCreateImport.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
