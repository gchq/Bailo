/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import * as uiConfig from '../data/uiConfig'
import Banner from './Banner'

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

    const uiConfigMock = jest.spyOn(uiConfig, 'useGetUiConfig')
    uiConfigMock.mockReturnValue(mockedConfig)

    render(<Banner />)

    await waitFor(async () => {
      expect(await screen.findByText('TEST')).not.toBeUndefined()
    })
  })
})
