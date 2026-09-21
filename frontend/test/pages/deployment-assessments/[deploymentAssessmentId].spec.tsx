import { fireEvent, render, screen } from '@testing-library/react'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { useGetSchema } from 'actions/schema'
import DeploymentAssessment from 'pages/deployment-assessments/[deploymentAssessmentId]/index'
import {
  DeploymentAssessmentInterface,
  DeploymentAssessmentMetadata,
  DeploymentAssessmentState,
  ResponseInterface,
  SchemaInterface,
  SchemaKind,
} from 'types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendNotification = vi.fn()

vi.mock('actions/deploymentAssessment', () => ({
  patchDeploymentAssessment: vi.fn(() =>
    Promise.resolve({ ok: true, json: async () => ({ deploymentAssessment: { draft: false } }) }),
  ),
}))

vi.mock('actions/deploymentAssessments', () => ({
  useGetDeploymentAssessment: vi.fn(),
}))

vi.mock('actions/schema', () => ({
  useGetSchema: vi.fn(),
}))

vi.mock('actions/review', () => ({
  postDeploymentAssessmentReviewResponse: vi.fn(),
  useGetReviewsForDeploymentAssessment: () => ({
    reviews: [],
    isReviewsLoading: false,
    isReviewsError: undefined,
    mutateReviews: vi.fn(),
  }),
}))

vi.mock('src/reviews/ReviewComments', () => ({ default: () => <div data-test='reviewComments' /> }))

vi.mock('src/entry/model/reviews/ReviewBanner', () => ({ default: () => <div data-test='reviewBanner' /> }))

vi.mock('src/deployment-assessments/AssessmentStateChip', () => ({
  default: () => <div data-test='assessmentStateChip' />,
}))

vi.mock('src/deployment-assessments/EditableDeploymentAssessmentForm', () => ({
  default: ({ showValidationErrors }: { showValidationErrors: boolean }) => (
    <div data-test='deploymentAssessmentForm'>{showValidationErrors ? 'marking required fields' : 'no marking'}</div>
  ),
}))

vi.mock('src/hooks/useNotification', () => ({
  default: () => sendNotification,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { deploymentAssessmentId: 'assessment-abc123' }, isReady: true }),
}))

const testSchema: SchemaInterface = {
  id: 'deployment-assessment-schema',
  name: 'Deployment assessment schema',
  description: '',
  active: true,
  hidden: false,
  kind: SchemaKind.DEPLOYMENT_ASSESSMENT,
  meta: {},
  uiSchema: {},
  reviewRoles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  jsonSchema: {
    type: 'object',
    properties: {
      overview: {
        title: 'About the Deployment',
        type: 'object',
        properties: {
          name: { title: 'Name of Deployment', type: 'string' },
        },
        required: ['name'],
      },
    },
    required: ['overview'],
  },
}

// `useGetDeploymentAssessment` flattens the response's `state` and `responses` onto the assessment
const testDeploymentAssessment: DeploymentAssessmentInterface & { responses: ResponseInterface[] } = {
  _id: 'abc123',
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'A draft assessment',
  draft: true,
  state: DeploymentAssessmentState.NeedsReview,
  justification: '',
  owner: ['user:user'],
  createdBy: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: { overview: {} },
  responses: [],
}

function renderPage(metadata: DeploymentAssessmentMetadata) {
  vi.mocked(useGetSchema).mockReturnValue({
    schema: testSchema,
    isSchemaLoading: false,
    isSchemaError: undefined,
    mutateSchema: vi.fn(),
  })
  vi.mocked(useGetDeploymentAssessment).mockReturnValue({
    deploymentAssessment: { ...testDeploymentAssessment, metadata },
    isDeploymentAssessmentLoading: false,
    isDeploymentAssessmentError: undefined,
    mutateDeploymentAssessment: vi.fn(),
  })

  return render(<DeploymentAssessment />)
}

describe('DeploymentAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not publish an incomplete deployment assessment', async () => {
    renderPage({ overview: {} })

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(sendNotification).toHaveBeenCalledWith({
      msg: 'Unable to publish incomplete Deployment Assessment.',
      variant: 'error',
    })
    expect(screen.queryByText('Publish Deployment Assessment')).toBeNull()
    expect(patchDeploymentAssessment).not.toHaveBeenCalled()
    expect(await screen.findByText('marking required fields')).toBeDefined()
  })

  it('asks for confirmation before publishing a complete deployment assessment', async () => {
    renderPage({ overview: { name: 'A deployment' } })

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(sendNotification).not.toHaveBeenCalled()
    expect(await screen.findByText('Publish Deployment Assessment')).toBeDefined()
    expect(patchDeploymentAssessment).not.toHaveBeenCalled()
    expect(screen.getByText('no marking')).toBeDefined()
  })

  it('surfaces a schema load failure instead of reporting an incomplete assessment', () => {
    vi.mocked(useGetSchema).mockReturnValue({
      schema: undefined,
      isSchemaLoading: false,
      isSchemaError: Object.assign(new Error('Unable to load schema'), {
        info: { message: 'Unable to load schema' },
        status: 500,
      }),
      mutateSchema: vi.fn(),
    })
    vi.mocked(useGetDeploymentAssessment).mockReturnValue({
      deploymentAssessment: testDeploymentAssessment,
      isDeploymentAssessmentLoading: false,
      isDeploymentAssessmentError: undefined,
      mutateDeploymentAssessment: vi.fn(),
    })

    render(<DeploymentAssessment />)

    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('makes no request when the confirmation is cancelled', async () => {
    renderPage({ overview: { name: 'A deployment' } })

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(patchDeploymentAssessment).not.toHaveBeenCalled()
  })

  it('publishes the deployment assessment when the confirmation is accepted', async () => {
    renderPage({ overview: { name: 'A deployment' } })

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    expect(patchDeploymentAssessment).toHaveBeenCalledWith('assessment-abc123', undefined, false)
  })
})
