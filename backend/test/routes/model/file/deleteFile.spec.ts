import { describe, expect, test, vi } from 'vitest'

import { deleteFileSchema } from '../../../../src/routes/v2/model/file/deleteFile.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

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
})
