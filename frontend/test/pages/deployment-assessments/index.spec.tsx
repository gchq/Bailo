import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DeploymentAssessmentCommentHistory,
  DeploymentAssessmentReviewHistory,
  useGetDeploymentAssessment,
  useGetDeploymentAssessmentComments,
  useGetDeploymentAssessmentReviews,
  useGetDeploymentAssessments,
} from 'actions/deploymentAssessments'
import { postDeploymentAssessmentReviewResponse, useGetReviewsForDeploymentAssessment } from 'actions/review'
import DeploymentAssessment from 'pages/deployment-assessments/[deploymentAssessmentId]'
import DeploymentAssessments from 'pages/deployment-assessments/index'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { DecisionKeys, DeploymentAssessmentInterface, DeploymentAssessmentSummary, UiConfig } from 'types/types'
import { beforeEach, describe, expect, it, test, vi } from 'vitest'

const mockRouter = vi.hoisted(() => ({
  query: { deploymentAssessmentId: 'assessment-id' },
  isReady: true,
  replace: vi.fn(),
  push: vi.fn(),
}))

vi.mock('actions/deploymentAssessments', () => ({
  useGetDeploymentAssessments: vi.fn(),
  useGetDeploymentAssessment: vi.fn(),
  useGetDeploymentAssessmentComments: vi.fn(),
  useGetDeploymentAssessmentReviews: vi.fn(),
}))

vi.mock('src/deployment-assessments/NeedsAction', () => ({
  default: () => <div data-test='needsAction' />,
}))

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('actions/deploymentAssessment', () => ({
  patchDeploymentAssessment: vi.fn(),
}))

vi.mock('actions/review', () => ({
  postDeploymentAssessmentReviewResponse: vi.fn(),
  useGetReviewsForDeploymentAssessment: vi.fn(),
}))

vi.mock('src/deployment-assessments/EditableDeploymentAssessmentForm', () => ({
  default: () => <div data-test='deploymentAssessmentForm' />,
}))

vi.mock('src/deployment-assessments/AssessmentStateChip', () => ({
  default: () => <div data-test='assessmentStateChip' />,
}))

vi.mock('src/entry/model/releases/DraftBanner', () => ({
  DraftBanner: () => <div data-test='draftBanner' />,
}))

vi.mock('src/entry/model/reviews/ReviewBanner', () => ({
  default: ({ onReviewButtonClicked }: { onReviewButtonClicked?: (anchor: HTMLElement | null) => void }) => (
    <button onClick={(event) => onReviewButtonClicked?.(event.currentTarget)}>Review</button>
  ),
}))

vi.mock('src/common/ReviewWithComment', () => ({
  default: ({ onSubmit }: { onSubmit: (decision: DecisionKeys, comment: string) => void }) => (
    <button onClick={() => onSubmit('approve', 'Formal approval')}>Submit formal review</button>
  ),
}))

type HistoryProps = {
  comments: DeploymentAssessmentCommentHistory[]
  reviews: DeploymentAssessmentReviewHistory[]
  isLoading: boolean
}

vi.mock('src/deployment-assessments/DeploymentAssessmentReviewHistory', () => ({
  default: ({ comments, reviews, isLoading }: HistoryProps) => (
    <div data-test='deploymentAssessmentReviewHistory'>
      {isLoading ? 'History loading' : 'History loaded'}
      <div>{comments.map((comment) => comment.comment).join(', ')}</div>
      <div>{reviews.map((review) => review.comment).join(', ')}</div>
    </div>
  ),
}))

const testUiConfig = { roleDisplayNames: { riskOwner: 'Deployment Risk Owner' } } as UiConfig

const testDeploymentAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'A Model to make everything',
  draft: true,
  createdBy: 'creator',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const deploymentAssessment: DeploymentAssessmentInterface = {
  _id: 'mongo-assessment-id',
  id: 'assessment-id',
  schemaId: 'deployment-assessment-schema',
  name: 'Assessment without legacy responses',
  metadata: { overview: {} },
  draft: false,
  state: 'needs_review',
  justification: 'Required for deployment',
  owner: ['risk-owner'],
  createdBy: 'creator',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const comment: DeploymentAssessmentCommentHistory = {
  id: 'comment-id',
  entity: 'user:commenter',
  comment: 'Comment from the v3 comments endpoint',
  reactions: [],
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const review: DeploymentAssessmentReviewHistory = {
  id: 'review-id',
  entity: 'user:reviewer',
  decision: 'approve',
  comment: 'Review from the v3 reviews endpoint',
  reactions: [],
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
  outdated: false,
}

function renderPage(deploymentAssessments: DeploymentAssessmentSummary[]) {
  vi.mocked(useGetDeploymentAssessments).mockReturnValue({
    deploymentAssessments,
    isDeploymentAssessmentsLoading: false,
    isDeploymentAssessmentsError: undefined,
    mutateDeploymentAssessments: vi.fn(),
  })

  return render(
    <UiConfigContext.Provider value={testUiConfig}>
      <DeploymentAssessments />
    </UiConfigContext.Provider>,
  )
}

function setupDetailPageMocks() {
  const mutateDeploymentAssessment = vi.fn()
  const mutateDeploymentAssessmentReviews = vi.fn()
  const mutateReviews = vi.fn()

  vi.mocked(useGetDeploymentAssessment).mockReturnValue({
    deploymentAssessment,
    isDeploymentAssessmentLoading: false,
    isDeploymentAssessmentError: undefined,
    mutateDeploymentAssessment,
  })
  vi.mocked(useGetDeploymentAssessmentComments).mockReturnValue({
    deploymentAssessmentComments: [comment],
    isDeploymentAssessmentCommentsLoading: false,
    isDeploymentAssessmentCommentsError: undefined,
    mutateDeploymentAssessmentComments: vi.fn(),
  })
  vi.mocked(useGetDeploymentAssessmentReviews).mockReturnValue({
    deploymentAssessmentReviews: [review],
    deploymentAssessmentReviewStatuses: [],
    isDeploymentAssessmentReviewsLoading: false,
    isDeploymentAssessmentReviewsError: undefined,
    mutateDeploymentAssessmentReviews,
  })
  vi.mocked(useGetReviewsForDeploymentAssessment).mockReturnValue({
    reviews: [],
    isReviewsLoading: false,
    isReviewsError: undefined,
    mutateReviews,
  })

  return { mutateDeploymentAssessment, mutateDeploymentAssessmentReviews, mutateReviews }
}

describe('DeploymentAssessments', () => {
  it('counts the assessments needing action on the tab', async () => {
    renderPage([testDeploymentAssessment, { ...testDeploymentAssessment, id: 'assessment-def456' }])

    await waitFor(async () => {
      expect(await screen.findByText('Needs action (2)')).toBeDefined()
    })
  })

  it('omits the count when nothing needs action', async () => {
    renderPage([])

    await waitFor(async () => {
      expect(await screen.findByText('Needs action')).toBeDefined()
    })
  })

  it('only counts the assessments that need action', async () => {
    renderPage([])

    expect(useGetDeploymentAssessments).toHaveBeenCalledWith({ needsAction: true })
  })
})

describe('DeploymentAssessment detail page', () => {
  beforeEach(() => {
    mockRouter.query = { deploymentAssessmentId: 'assessment-id' }
    vi.mocked(postDeploymentAssessmentReviewResponse).mockReset()
  })

  test('loads v3 history and passes it to the history component without legacy responses', () => {
    setupDetailPageMocks()

    render(<DeploymentAssessment />)

    expect(useGetDeploymentAssessmentComments).toHaveBeenCalledWith('assessment-id')
    expect(useGetDeploymentAssessmentReviews).toHaveBeenCalledWith('assessment-id')
    expect(screen.getByTestId('deploymentAssessmentReviewHistory').textContent).toContain('History loaded')
    expect(screen.getByText(comment.comment)).toBeDefined()
    expect(screen.getByText(review.comment!)).toBeDefined()
  })

  test('refreshes deployment assessment details and v3 review history after submitting a formal review', async () => {
    const user = userEvent.setup()
    const { mutateDeploymentAssessment, mutateDeploymentAssessmentReviews, mutateReviews } = setupDetailPageMocks()
    vi.mocked(postDeploymentAssessmentReviewResponse).mockResolvedValueOnce({ ok: true } as Response)

    render(<DeploymentAssessment />)

    await user.click(screen.getByRole('button', { name: 'Review' }))
    await user.click(await screen.findByRole('button', { name: 'Submit formal review' }))

    await waitFor(() => {
      expect(postDeploymentAssessmentReviewResponse).toHaveBeenCalledWith({
        deploymentAssessmentId: 'assessment-id',
        decision: 'approve',
        comment: 'Formal approval',
      })
      expect(mutateReviews).toHaveBeenCalledOnce()
      expect(mutateDeploymentAssessment).toHaveBeenCalledOnce()
      expect(mutateDeploymentAssessmentReviews).toHaveBeenCalledOnce()
    })
  })
})
