/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { useGetUiConfig } from '../../data/uiConfig'
import { doNothing } from '../../utils/testUtils'
import ModelEditSubmission from './ModelEditSubmission'

jest.mock('../../data/uiConfig', () => ({
  useGetUiConfig: jest.fn(),
}))

describe('ModelEditSubmission', () => {
  it('renders an ModelEditSubmission component', async () => {
    const mockedConfig: any = {
      uiConfig: {
        uploadWarning: {
          showWarning: true,
          checkboxText: 'please check before submitting',
        },
      },
      isUiConfigLoading: false,
      isUiConfigError: false,
    }

    ;(useGetUiConfig as unknown as jest.Mock).mockReturnValueOnce(mockedConfig)

    render(<ModelEditSubmission onSubmit={doNothing} activeStep={1} setActiveStep={doNothing} modelUploading={false} />)

    await waitFor(async () => {
      expect(await screen.findByText('please check before submitting')).not.toBeUndefined()
      expect(
        await screen.findByText('If you are happy with your submission click below to upload your model to Bailo.')
      ).not.toBeUndefined()
    })
  })
})
