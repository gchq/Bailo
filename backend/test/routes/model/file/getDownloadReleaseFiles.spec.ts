import { Readable } from 'node:stream'
import { gunzipSync } from 'node:zlib'

import { extract } from 'tar-stream'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const files = [
  { id: 'file-a', name: '../alpha.txt', size: 5, updatedAt: new Date('2026-09-07T09:00:00Z') },
  { id: 'file-b', name: 'beta.txt', size: 4, updatedAt: new Date('2026-09-07T09:00:00Z') },
]

const fileMock = vi.hoisted(() => ({
  authoriseFileDownloads: vi.fn(),
  downloadFile: vi.fn((_user, fileId: string) =>
    Promise.resolve(Readable.from([fileId === 'file-a' ? 'alpha' : 'beta'])),
  ),
  getFilesByIds: vi.fn(() => files),
}))
vi.mock('../../../../src/services/file.js', () => fileMock)

const releaseMock = vi.hoisted(() => ({
  getReleaseBySemver: vi.fn(() => ({ fileIds: ['file-a', 'file-b'] })),
}))
vi.mock('../../../../src/services/release.js', () => releaseMock)

function binaryParser(res, callback) {
  const chunks: Buffer[] = []
  res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  res.on('end', () => callback(null, Buffer.concat(chunks)))
}

async function listTarEntries(archive: Buffer) {
  const entries = new Map<string, string>()
  const untar = extract()
  const complete = new Promise<void>((resolve, reject) => {
    untar.on('entry', (header, stream, next) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk as Uint8Array)))
      stream.on('end', () => {
        entries.set(header.name, Buffer.concat(chunks).toString('utf8'))
        next()
      })
      stream.resume()
    })
    untar.on('finish', resolve)
    untar.on('error', reject)
  })
  untar.end(gunzipSync(archive))
  await complete
  return entries
}

describe('routes > files > getDownloadReleaseFiles', () => {
  test('downloads all files in a release as a tar.gz archive', async () => {
    const res = await testGet('/api/v2/model/model-123/release/1.2.3/files/download').buffer(true).parse(binaryParser)

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/gzip')
    expect(res.headers['content-disposition']).toContain('model-123-1.2.3.tar.gz')

    const entries = await listTarEntries(res.body)
    expect(Object.fromEntries(entries)).toEqual({ 'alpha.txt': 'alpha', 'beta.txt': 'beta' })
    expect(fileMock.authoriseFileDownloads).toHaveBeenCalledWith(expect.anything(), 'model-123', files)
    expect(fileMock.downloadFile).toHaveBeenCalledTimes(2)
    expect(audit.onViewFile).toHaveBeenCalledTimes(2)
  })

  test('rejects before streaming when not every release file is visible', async () => {
    fileMock.getFilesByIds.mockReturnValueOnce([files[0]])

    const res = await testGet('/api/v2/model/model-123/release/1.2.3/files/download')

    expect(res.statusCode).toBe(403)
    expect(fileMock.authoriseFileDownloads).not.toHaveBeenCalled()
    expect(fileMock.downloadFile).not.toHaveBeenCalled()
  })

  test('returns a server error when an archive stream cannot be created', async () => {
    fileMock.downloadFile.mockRejectedValueOnce(new Error('storage unavailable'))

    const res = await testGet('/api/v2/model/model-123/release/1.2.3/files/download')

    expect(res.statusCode).toBe(500)
    expect(res.body).toMatchObject({
      name: 'Release archive download error',
      message: 'Error occurred whilst streaming release archive',
    })
  })
})
