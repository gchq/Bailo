/**
 * @jest-environment jsdom
 */

import ModelEditSubmission from './ModelEditSubmission'
import { render, screen, waitFor } from '@testing-library/react'
import * as uiConfig from '../../data/uiConfig'

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

    const uiConfigMock = jest.spyOn(uiConfig, 'useGetUiConfig')
    uiConfigMock.mockReturnValue(mockedConfig)

    render(<ModelEditSubmission onSubmit={() => {}} activeStep={1} setActiveStep={() => {}} modelUploading={false} />)

    await waitFor(async () => {
      expect(await screen.findByText('please check before submitting')).not.toBeUndefined()
      expect(
        await screen.findByText('If you are happy with your submission click below to upload your model to Bailo.')
      ).not.toBeUndefined()
    })
  })
})
