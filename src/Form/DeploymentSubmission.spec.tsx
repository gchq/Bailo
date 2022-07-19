/**
 * @jest-environment jsdom
 */

import DeploymentSubmission from './DeploymentSubmission'
import { render, screen, waitFor } from '@testing-library/react'
import * as uiConfig from '../../data/uiConfig'

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

    const uiConfigMock = jest.spyOn(uiConfig, 'useGetUiConfig')
    uiConfigMock.mockReturnValue(mockedConfig)

    render(<DeploymentSubmission onSubmit={() => {}} activeStep={1} setActiveStep={() => {}} />)

    await waitFor(async () => {
      expect(await screen.findByText('Request Deployment')).not.toBeUndefined()
      expect(await screen.findByText('Previous Section')).not.toBeUndefined()
      expect(await screen.findByText('please check before submitting')).not.toBeUndefined()
    })
  })
})
