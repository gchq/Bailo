import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postFinishMultipartUploadSchema } from '../../../../src/routes/v2/model/file/postFinishMultipartUpload.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/file.js', () => ({
  finishUploadMultipartFile: vi.fn(() => ({ id: 'test' })),
}))

describe('routes > model > file > postFinishMultipartUpload', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postFinishMultipartUploadSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/finish`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postFinishMultipartUploadSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/finish`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateFile).toBeCalled()
    expect(audit.onUpdateFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('400 > no name', async () => {
    const fixture = createFixture(postFinishMultipartUploadSchema) as any
    // This fixture does not include a fileId.
    delete fixture.body.fileId

    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/files/upload/multipart/finish`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
