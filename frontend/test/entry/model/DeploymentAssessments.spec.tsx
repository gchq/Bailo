import { fireEvent, render, screen } from '@testing-library/react'
import DeploymentAssessments, { noModelCardMessage } from 'src/entry/model/DeploymentAssessments'
import { noDeploymentAssessmentSchemasMessage } from 'src/hooks/useDeploymentAssessmentSchemaAvailability'
import { type EntryInterface } from 'types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useGetSchemas: vi.fn(),
  push: vi.fn(),
}))

vi.mock('actions/schema', () => ({
  useGetSchemas: mocks.useGetSchemas,
}))

vi.mock('actions/deploymentAssessments', () => ({
  useGetDeploymentAssessments: () => ({
    deploymentAssessments: [],
    isDeploymentAssessmentsLoading: false,
    isDeploymentAssessmentsError: undefined,
  }),
}))

vi.mock('src/common/Paginate', () => ({
  default: () => <div data-test='deploymentAssessmentsPaginate' />,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, replace: vi.fn(), push: mocks.push }),
}))

const modelWithCard = { id: 'test-model', card: { schemaId: 'model-schema' } } as unknown as EntryInterface
const modelWithoutCard = { id: 'test-model' } as unknown as EntryInterface

function getCreateButton() {
  return screen.getByRole('button', { name: /Create Deployment Assessment/i }) as HTMLButtonElement
}

describe('entry > model > DeploymentAssessments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useGetSchemas.mockReturnValue({
      schemas: [{ id: 'deployment-assessment-schema' }],
      isSchemasLoading: false,
      isSchemasError: undefined,
    })
  })

  it('requests only non-hidden Deployment Assessment schemas', () => {
    render(<DeploymentAssessments model={modelWithCard} />)

    expect(mocks.useGetSchemas).toHaveBeenCalledWith('deploymentAssessment', false)
  })

  it('enables the create button and navigates to the new Deployment Assessment page', () => {
    render(<DeploymentAssessments model={modelWithCard} />)

    const button = getCreateButton()
    expect(button.disabled).toBe(false)

    fireEvent.click(button)
    expect(mocks.push).toHaveBeenCalledWith('/deployment-assessments/new')
  })

  it('disables the create button and explains why when no Deployment Assessment schemas are available', async () => {
    mocks.useGetSchemas.mockReturnValue({ schemas: [], isSchemasLoading: false, isSchemasError: undefined })

    render(<DeploymentAssessments model={modelWithCard} />)

    const button = getCreateButton()
    expect(button.disabled).toBe(true)

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(await screen.findByText(noDeploymentAssessmentSchemasMessage)).toBeDefined()
  })

  it('disables the create button and explains why when the model has no model card', async () => {
    mocks.useGetSchemas.mockReturnValue({ schemas: [], isSchemasLoading: false, isSchemasError: undefined })

    render(<DeploymentAssessments model={modelWithoutCard} />)

    const button = getCreateButton()
    expect(button.disabled).toBe(true)

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(await screen.findByText(noModelCardMessage)).toBeDefined()
    expect(screen.queryByText(noDeploymentAssessmentSchemasMessage)).toBeNull()
  })

  it('disables the create button without a tooltip while schemas are loading', () => {
    mocks.useGetSchemas.mockReturnValue({ schemas: [], isSchemasLoading: true, isSchemasError: undefined })

    render(<DeploymentAssessments model={modelWithCard} />)

    const button = getCreateButton()
    expect(button.disabled).toBe(true)

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(screen.queryByText(noDeploymentAssessmentSchemasMessage)).toBeNull()
  })

  it('leaves the create button enabled if schemas fail to load', () => {
    mocks.useGetSchemas.mockReturnValue({
      schemas: [],
      isSchemasLoading: false,
      isSchemasError: { status: 500, info: { message: 'error' } },
    })

    render(<DeploymentAssessments model={modelWithCard} />)

    expect(getCreateButton().disabled).toBe(false)
  })
})
