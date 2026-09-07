import useSWR from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGetAccessRequests } from '../../actions/accessRequest'

vi.mock('swr', () => ({
  default: vi.fn(() => ({ data: undefined, isLoading: false, error: undefined, mutate: vi.fn() })),
}))

describe('actions > accessRequest', () => {
  beforeEach(() => {
    vi.mocked(useSWR).mockClear()
  })

  it('uses the API modelId query key when filtering by model', () => {
    useGetAccessRequests(['model-a', 'model-b'], '', true)

    expect(useSWR).toHaveBeenCalledWith(
      '/api/v2/access-requests/search?modelId=model-a&modelId=model-b&mine=true',
      expect.any(Function),
    )
  })
})
