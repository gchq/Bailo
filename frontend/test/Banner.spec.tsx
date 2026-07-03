import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { describe, expect, it, vi } from 'vitest'

import Banner from '../src/Banner'

vi.mock('../actions/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
}))

describe('Banner', () => {
  it('renders a Banner component', async () => {
    const mockedConfig: any = {
      banner: {
        enabled: true,
        text: 'TEST',
        colour: 'blue',
      },
    }

    vi.mocked(useContext).mockReturnValueOnce(mockedConfig)

    render(<Banner />)

    await waitFor(async () => {
      expect(await screen.findByText('TEST')).not.toBeUndefined()
    })
  })
})
