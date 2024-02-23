import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postSimpleUploadSchema } from '../../../../src/routes/v2/model/file/postSimpleUpload.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/v2/file.js', () => ({
  uploadFile: vi.fn(() => ({ _id: 'test' })),
}))

describe('routes > model > file > postSimpleUpload', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postSimpleUploadSchema)
    const modelId = 'example'

    const res = await testPost(`/api/v2/model/${modelId}/files/upload/simple?${qs.stringify(fixture.query)}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postSimpleUploadSchema)
    const modelId = 'example'

    const res = await testPost(`/api/v2/model/${modelId}/files/upload/simple?${qs.stringify(fixture.query)}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateFile).toBeCalled()
    expect(audit.onCreateFile.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('400 > no name', async () => {
    const fixture = createFixture(postSimpleUploadSchema) as any
    const modelId = 'example'

    // This fixture does not include a name.
    delete fixture.query.name

    const res = await testPost(`/api/v2/model/${modelId}/files/upload/simple?${qs.stringify(fixture.query)}`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
