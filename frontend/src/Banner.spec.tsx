/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { useGetUiConfig } from '../data/uiConfig'
import Banner from './Banner'

jest.mock('../data/uiConfig', () => ({
  useGetUiConfig: jest.fn(),
}))

describe('Banner', () => {
  it('renders a Banner component', async () => {
    const mockedConfig: any = {
      uiConfig: {
        banner: {
          enable: true,
          text: 'TEST',
          colour: 'blue',
        },
      },
      isUiConfigLoading: false,
      isUiConfigError: false,
    }

    ;(useGetUiConfig as unknown as jest.Mock).mockReturnValueOnce(mockedConfig)

    render(<Banner />)

    await waitFor(async () => {
      expect(await screen.findByText('TEST')).not.toBeUndefined()
    })
  })
})
