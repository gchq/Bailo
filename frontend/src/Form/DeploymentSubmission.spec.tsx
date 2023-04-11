/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { useGetUiConfig } from '../../data/uiConfig'
import { doNothing } from '../../utils/testUtils'
import DeploymentSubmission from './DeploymentSubmission'

jest.mock('../../data/uiConfig', () => ({
  useGetUiConfig: jest.fn(),
}))

describe('DeploymentSubmission', () => {
  it('renders an DeploymentSubmission component', async () => {
    const mockedConfig: any = {
      uiConfig: {
        deploymentWarning: {
          showWarning: true,
          checkboxText: 'please check before submitting',
        },
      },
      isUiConfigLoading: false,
      isUiConfigError: false,
    }

    ;(useGetUiConfig as unknown as jest.Mock).mockReturnValueOnce(mockedConfig)

    render(<DeploymentSubmission onSubmit={doNothing} activeStep={1} setActiveStep={doNothing} />)

    await waitFor(async () => {
      expect(await screen.findByText('Request Deployment')).not.toBeUndefined()
      expect(await screen.findByText('Previous Section')).not.toBeUndefined()
      expect(await screen.findByText('please check before submitting')).not.toBeUndefined()
    })
  })
})
