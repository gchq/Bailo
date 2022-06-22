/**
 * @jest-environment jsdom
 */

import ModelExportAndSubmission from './ModelExportAndSubmission'
import { render, screen, waitFor } from '@testing-library/react'
import * as uiConfig from '../../data/uiConfig'

describe('ModelExportAndSubmission', () => {
  it('renders a ModelExportAndSubmission component', async () => {
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

    const formData = {
      name: 'test name',
    }

    const splitSchema: any = {
      reference: 'test-schema',
      steps: [
        {
          schema: {
            name: {
              type: 'string',
              title: 'name',
            },
          },
          state: {},
          schemaRef: 'test-schema',
          type: 'Message',
          index: 0,
          section: 'submission',
          render: () => null,
          renderButtons: () => <div>test page</div>,
          isComplete: () => true,
        },
      ],
    }

    render(
      <ModelExportAndSubmission
        formData={formData}
        schemaRef='test-schema'
        splitSchema={splitSchema}
        onSubmit={() => {}}
        activeStep={1}
        setActiveStep={() => {}}
        modelUploading={false}
      />
    )

    await waitFor(async () => {
      expect(await screen.findByText('please check before submitting')).not.toBeUndefined()
      expect(
        await screen.findByText('If you are happy with your submission click below to upload your model to Bailo.')
      ).not.toBeUndefined()
      expect(
        await screen.findByText('Click below to download your metadata as a JSON file for easy distribution.')
      ).not.toBeUndefined()
    })
  })
})
