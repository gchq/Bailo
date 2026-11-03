import { postFileForModelId } from 'actions/file'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios')

function uploadUrl() {
  return new URL(vi.mocked(axios.post).mock.calls[0][0], 'https://example.com')
}

describe('postFileForModelId', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockResolvedValue({ data: {} })
  })

  it('encodes a MIME type containing reserved characters', async () => {
    const file = new File(['content'], 'notes.txt', { type: 'text/plain;charset=utf-8' })

    await postFileForModelId('model-1', file, vi.fn())

    expect(uploadUrl().searchParams.get('mime')).toBe('text/plain;charset=utf-8')
  })

  it('does not let a MIME type inject extra query parameters', async () => {
    const file = new File(['content'], 'notes.txt', { type: 'text/plain&tags=injected' })

    await postFileForModelId('model-1', file, vi.fn())

    expect(uploadUrl().searchParams.get('mime')).toBe('text/plain&tags=injected')
    expect(uploadUrl().searchParams.has('tags')).toBe(false)
  })

  it('falls back to application/octet-stream when the file has no type', async () => {
    const file = new File(['content'], 'model.bin')

    await postFileForModelId('model-1', file, vi.fn())

    expect(uploadUrl().searchParams.get('mime')).toBe('application/octet-stream')
  })

  it('encodes a nested upload name', async () => {
    const file = new File(['content'], 'model.bin')

    await postFileForModelId('model-1', file, vi.fn(), undefined, 'weights/v1 & v2/model.bin')

    expect(uploadUrl().searchParams.get('name')).toBe('weights/v1 & v2/model.bin')
  })
})
