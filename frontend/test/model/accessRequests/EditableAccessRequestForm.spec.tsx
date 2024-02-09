import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { useGetAccessRequest } from 'actions/accessRequest'
import EditableAccessRequestForm from 'src/model/beta/accessRequests/EditableAccessRequestForm'
import { lightTheme } from 'src/theme'
import { testAccessRequest, testAccessRequestSchema, testAccessRequestSchemaStepNoRender } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

import { useGetSchema } from '../../../actions/schema'

vi.mock('../../../actions/schema', () => ({
  useGetSchema: vi.fn(),
}))
vi.mock('../../../actions/accessRequest', () => ({
  useGetAccessRequest: vi.fn(),
}))

const mockFormUtils = vi.hoisted(() => {
  return {
    getStepsFromSchema: vi.fn(),
    widgets: {},
    setStepState: vi.fn(),
  }
})
vi.mock('utils/beta/formUtils.ts', () => mockFormUtils)

describe('EditableAccessRequestForm', () => {
  it('renders a EditableAccessRequestForm component', async () => {
    vi.mocked(useGetSchema).mockReturnValue({
      schema: testAccessRequestSchema,
      isSchemaLoading: false,
      isSchemaError: undefined,
      mutateSchema: vi.fn(),
    })
    vi.mocked(useGetAccessRequest).mockReturnValue({
      accessRequest: testAccessRequest,
      isAccessRequestLoading: false,
      isAccessRequestError: undefined,
      mutateAccessRequest: vi.fn(),
    })
    mockFormUtils.getStepsFromSchema.mockReturnValue([testAccessRequestSchemaStepNoRender])
    render(
      <ThemeProvider theme={lightTheme}>
        <EditableAccessRequestForm accessRequest={testAccessRequest} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Edit Access Request')).toBeDefined()
    })
  })
})
