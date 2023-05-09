import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetUiConfig } from '../data/uiConfig'
import Banner from './Banner'

vi.mock('../data/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
}))

describe('Banner', () => {
  it('renders a Banner component', async () => {
    const mockedConfig: any = {
      uiConfig: {
        banner: {
          enabled: true,
          text: 'TEST',
          colour: 'blue',
        },
      },
      isUiConfigLoading: false,
      isUiConfigError: false,
    }

    vi.mocked(useGetUiConfig).mockReturnValueOnce(mockedConfig)

    render(<Banner />)

    await waitFor(async () => {
      expect(await screen.findByText('TEST')).not.toBeUndefined()
    })
  })
})
