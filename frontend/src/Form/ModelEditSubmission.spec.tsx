import { render, screen, waitFor } from '@testing-library/react'
import { expect, vi } from 'vitest'

import { useGetUiConfig } from '../../data/uiConfig'
import { doNothing } from '../../utils/testUtils'
import ModelEditSubmission from './ModelEditSubmission'

vi.mock('../../data/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
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

    vi.mocked(useGetUiConfig).mockReturnValueOnce(mockedConfig)

    render(<ModelEditSubmission onSubmit={doNothing} activeStep={1} setActiveStep={doNothing} modelUploading={false} />)

    await waitFor(async () => {
      expect(await screen.findByText('please check before submitting')).not.toBeUndefined()
      expect(
        await screen.findByText('If you are happy with your submission click below to upload your model to Bailo.')
      ).not.toBeUndefined()
    })
  })
})
