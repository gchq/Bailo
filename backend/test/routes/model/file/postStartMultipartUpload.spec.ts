import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postStartMultipartUploadSchema } from '../../../../src/routes/v2/model/file/postStartMultipartUpload.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/file.js', () => ({
  startUploadMultipartFile: vi.fn(() => ({
    file: { id: 'test' },
    uploadId: 'test',
    chunks: [{ presignedUrl: 'string', startByte: 0, endByte: 12345 }],
  })),
}))

describe('routes > model > file > postStartMultipartUpload', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postStartMultipartUploadSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/start`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postStartMultipartUploadSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/start`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateFile).toBeCalled()
    expect(audit.onCreateFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('400 > no name', async () => {
    const fixture = createFixture(postStartMultipartUploadSchema) as any
    // This fixture does not include a name.
    delete fixture.body.name

    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/start`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
