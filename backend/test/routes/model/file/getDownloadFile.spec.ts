import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getDownloadFileSchema } from '../../../../src/routes/v2/model/file/getDownloadFile.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

const rangeMock = vi.hoisted(() => ({
  parseRangeHeaders: vi.fn(),
}))
vi.mock('../../../../src/utils/range.js', () => rangeMock)

const mockFileObject = {
  _id: { toString: vi.fn(() => 'fileId') },
  updatedAt: { getTime: vi.fn(() => 123456789) },
  size: 100,
  name: 'test-file.txt',
  mime: 'text/plain',
}

const fileMock = vi.hoisted(() => ({
  getFileById: vi.fn(() => mockFileObject),
  downloadFile: vi.fn(() => Promise.resolve(Readable.from(['']))),
}))
vi.mock('../../../../src/services/file.js', () => fileMock)

const releaseMock = vi.hoisted(() => ({
  getFileByReleaseFileName: vi.fn(() => mockFileObject),
}))
vi.mock('../../../../src/services/release.js', () => releaseMock)

type UrlBuilder = (fixture: ReturnType<typeof createFixture>) => string

describe('routes > files > getDownloadFile', () => {
  // parametrise tests for both endpoints
  describe.each<[string, UrlBuilder]>([
    [
      'modelId + semver + fileName download',
      (fixture) =>
        `/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}/file/${fixture.params.fileName}/download`,
    ],
    [
      'modelId + fileId download',
      (fixture) => `/api/v2/model/${fixture.params.modelId}/file/${fixture.params.fileId}/download`,
    ],
  ])('GET %s', async (name, buildUrl) => {
    test('200 > ok', async () => {
      const fixture = createFixture(getDownloadFileSchema)
      const res = await testGet(buildUrl(fixture))

      expect(res.statusCode).toBe(200)
      expect(res.body).matchSnapshot()
      expect(res.headers['content-disposition']).toContain('attachment')
      expect(res.headers['content-disposition']).toContain('test-file.txt')
      expect(res.headers['content-type']).toBe('text/plain; charset=utf-8')
      expect(res.headers['accept-ranges']).toBe('bytes')
      expect(res.headers['cache-control']).toBe('public, max-age=604800, immutable')
      expect(res.headers.etag).toBe('f8a7130e2a7facf456c258e5e5f7b6b2fa02431de15fdf47b5ce0079d275aa54')
    })

    test('audit > expected call', async () => {
      const fixture = createFixture(getDownloadFileSchema)
      const res = await testGet(buildUrl(fixture))

      expect(res.statusCode).toBe(200)
      expect(audit.onViewFile).toBeCalled()
      expect(audit.onViewFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
      expect(audit.onViewFile.mock.calls.at(0)?.at(2)).toMatchSnapshot()
    })

    test('500 > error when stream errors before headers sent', async () => {
      fileMock.downloadFile.mockResolvedValueOnce(
        new Readable({
          read() {
            this.emit('error', new Error('boom'))
          },
        }),
      )
      const fixture = createFixture(getDownloadFileSchema)
      const res = await testGet(buildUrl(fixture))

      expect(res.statusCode).toBe(500)
      expect(res.body).toMatchObject({
        code: 500,
        name: 'File download error',
        message: 'Error occurred whilst streaming file',
      })
    })

    test('304 > not modified when If-None-Match matches', async () => {
      const fixture = createFixture(getDownloadFileSchema)
      const expectedEtag = 'f8a7130e2a7facf456c258e5e5f7b6b2fa02431de15fdf47b5ce0079d275aa54'
      const res = await testGet(buildUrl(fixture), {
        headers: {
          'If-None-Match': expectedEtag,
        },
      })

      expect(res.statusCode).toBe(304)
      expect(fileMock.downloadFile).not.toHaveBeenCalled()
      expect(audit.onViewFile).not.toHaveBeenCalled()
    })

    test('206 > partial content when range header is provided', async () => {
      rangeMock.parseRangeHeaders.mockReturnValueOnce({ start: 0, end: 9 })
      const fixture = createFixture(getDownloadFileSchema)
      const res = await testGet(buildUrl(fixture), {
        headers: {
          range: 'bytes=0-9',
        },
      })

      expect(res.statusCode).toBe(206)
      expect(rangeMock.parseRangeHeaders).toHaveBeenCalled()
      expect(fileMock.downloadFile).toHaveBeenCalledWith(expect.anything(), 'fileId', { start: 0, end: 9 })
    })

    test('200 > full content when parseRangeHeaders returns undefined', async () => {
      rangeMock.parseRangeHeaders.mockReturnValueOnce(undefined)
      const fixture = createFixture(getDownloadFileSchema)
      const res = await testGet(buildUrl(fixture), {
        headers: { range: 'bytes=0-10' },
      })

      expect(res.statusCode).toBe(200)
      expect(fileMock.downloadFile).toHaveBeenCalledWith(expect.anything(), 'fileId', undefined)
    })
  })
})
