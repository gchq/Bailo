import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { getDownloadFileSchema } from '../../../../src/routes/v2/model/file/getDownloadFile.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

const fileMock = vi.hoisted(() => {
  return {
    getFileById: vi.fn(() => ({
      name: 'testFile',
      mime: 'text/plain',
      size: 12,
    })),
    downloadFile: vi.fn(() => {
      return {
        Body: Readable.from(['file content']),
      }
    }),
  }
})
vi.mock('../../../../src/services/v2/file.js', () => fileMock)

describe('routes > files > getDownloadFile', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getDownloadFileSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/file/${fixture.params.fileId}/download`)

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-disposition']).toBe('inline; filename="testFile"')
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8')
    expect(res.headers['content-length']).toBe('12')
  })
})
