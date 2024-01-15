import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { deleteFileSchema } from '../../../../src/routes/v2/model/file/deleteFile.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

describe('routes > file > deleteFile', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/v2/file.js', () => ({
      removeFile: vi.fn(() => ({ message: 'Successfully removed release.' })),
    }))

    const fixture = createFixture(deleteFileSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/file/${fixture.params.fileId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../../src/services/v2/file.js', () => ({
      removeFile: vi.fn(() => ({ message: 'Successfully removed release.' })),
    }))

    const fixture = createFixture(deleteFileSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/file/${fixture.params.fileId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteFile).toBeCalled()
    expect(audit.onDeleteFile.mock.calls.at(0).at(1)).toMatchSnapshot()
    expect(audit.onDeleteFile.mock.calls.at(0).at(2)).toMatchSnapshot()
  })
})
