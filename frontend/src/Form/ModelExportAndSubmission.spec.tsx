import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetUiConfig } from '../../data/uiConfig'
import { doNothing } from '../../utils/testUtils'
import ModelExportAndSubmission from './ModelExportAndSubmission'

vi.mock('../../data/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
}))

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

    vi.mocked(useGetUiConfig).mockReturnValueOnce(mockedConfig)

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
        onSubmit={doNothing}
        activeStep={1}
        setActiveStep={doNothing}
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
