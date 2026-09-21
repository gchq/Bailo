import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetSchema } from 'actions/schema'
import { ReactElement, useState } from 'react'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import { lightTheme } from 'src/theme'
import { DeploymentAssessmentInterface, SchemaInterface } from 'types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/deploymentAssessment', () => ({
  patchDeploymentAssessment: vi.fn(),
}))

vi.mock('actions/schema', () => ({
  useGetSchema: vi.fn(),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, asPath: '/', replace: vi.fn(), push: vi.fn() }),
}))

vi.mock('src/common/UserDisplay', () => ({
  default: ({ dn }: { dn: string }) => <span>{dn}</span>,
}))

vi.mock('src/common/Restricted', () => ({
  default: ({ children }: { children: ReactElement }) => children,
}))

const testSchema = {
  id: 'deployment-assessment-schema',
  name: 'Deployment assessment schema',
  jsonSchema: {
    type: 'object',
    properties: {
      overview: {
        title: 'About the Deployment',
        type: 'object',
        required: ['name'],
        properties: { name: { title: 'Name of Deployment', type: 'string' } },
      },
    },
  },
} as unknown as SchemaInterface

const testDeploymentAssessment = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'A published assessment',
  draft: false,
  createdBy: 'user',
  metadata: { overview: {} },
} as unknown as DeploymentAssessmentInterface

/**
 * Mirrors the detail page: owns `isEdit` and swaps in fresh data when `mutate` resolves. `mutate`
 * revalidates over the network, so the fresh data only lands a tick after `handleSubmit` returns.
 */
function TestHarness({ updated }: { updated: DeploymentAssessmentInterface }) {
  const [isEdit, setIsEdit] = useState(false)
  const [deploymentAssessment, setDeploymentAssessment] = useState(testDeploymentAssessment)

  return (
    <ThemeProvider theme={lightTheme}>
      <EditableDeploymentAssessmentForm
        deploymentAssessment={deploymentAssessment}
        mutate={
          (async () => {
            await new Promise((resolve) => setTimeout(resolve, 250))
            setDeploymentAssessment(updated)
          }) as never
        }
        isEdit={isEdit}
        onIsEditChange={setIsEdit}
      />
    </ThemeProvider>
  )
}

describe('EditableDeploymentAssessmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGetSchema).mockReturnValue({
      schema: testSchema,
      isSchemaLoading: false,
      isSchemaError: undefined,
      mutateSchema: vi.fn(),
    })
  })

  const mockPatchResponse = (deploymentAssessment: DeploymentAssessmentInterface) =>
    vi.mocked(patchDeploymentAssessment).mockResolvedValue({
      ok: true,
      json: async () => ({ deploymentAssessment }),
    } as Response)

  const answerField = () => screen.getByLabelText('text input field for Name of Deployment') as HTMLInputElement

  it('shows the saved answer and clears the error once an incomplete assessment is completed', async () => {
    const user = userEvent.setup()
    const updated = {
      ...testDeploymentAssessment,
      metadata: { overview: { name: 'A deployment' } },
    } as DeploymentAssessmentInterface
    mockPatchResponse(updated)

    render(<TestHarness updated={updated} />)

    await user.click(await screen.findByRole('button', { name: /Edit Deployment Assessment/ }))
    await user.type(answerField(), 'A')

    // Clearing the answer again blocks the save and marks the missing field
    await user.clear(answerField())
    // The heading and the footer both render a Save button
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0])
    expect(await screen.findByText('This field is required')).toBeDefined()
    expect(patchDeploymentAssessment).not.toHaveBeenCalled()

    await user.type(answerField(), 'A deployment')
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0])

    await waitFor(() => expect(patchDeploymentAssessment).toHaveBeenCalled())

    // No stale flash: the saved answer is in place as soon as edit mode ends
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save' })).toBeNull())
    expect(answerField()).toHaveProperty('value', 'A deployment')
    expect(screen.queryByText('This field is required')).toBeNull()
  })

  it('blocks saving an unchanged assessment that is already incomplete', async () => {
    const user = userEvent.setup()
    mockPatchResponse(testDeploymentAssessment)

    render(<TestHarness updated={testDeploymentAssessment} />)

    await user.click(await screen.findByRole('button', { name: /Edit Deployment Assessment/ }))
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0])

    expect(await screen.findByText('This field is required')).toBeDefined()
    expect(patchDeploymentAssessment).not.toHaveBeenCalled()
    expect(screen.getAllByRole('button', { name: 'Save' })[0]).toBeDefined()
  })
})
