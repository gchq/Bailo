import { patchFile } from 'actions/file'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios', () => ({ default: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(axios).mockResolvedValue({ status: 200, data: {} })
})

describe('file access API client', () => {
  it.each([true, false])('sends access flag %s without losing false values', async (ungovernedAccess) => {
    await patchFile('model', 'file', { ungovernedAccess })
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'patch',
        url: '/api/v2/model/model/file/file',
        data: { tags: undefined, ungovernedAccess },
      }),
    )
  })

  it('preserves the existing tag-only request', async () => {
    await patchFile('model', 'file', { tags: ['image'] })
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({ data: { tags: ['image'], ungovernedAccess: undefined } }),
    )
  })
})
