import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postMultipartUploadPartSchema } from '../../../../src/routes/v2/model/file/postMultipartUploadPart.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/file.js', () => ({
  uploadMultipartFilePart: vi.fn(() => 'ETag'),
}))

describe('routes > model > file > postStartMultipartUpload', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postMultipartUploadPartSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/part`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postMultipartUploadPartSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/part`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateFile).toBeCalled()
    expect(audit.onUpdateFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('400 > no fileId', async () => {
    const fixture = createFixture(postMultipartUploadPartSchema) as any
    // This fixture does not include a fileId.
    delete fixture.body.fileId

    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/part`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
