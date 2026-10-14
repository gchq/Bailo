import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { postDeploymentAssessmentReviewComment } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import DeploymentAssessmentReviewHistoryComponent from 'src/deployment-assessments/DeploymentAssessmentReviewHistory'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type {
  DeploymentAssessmentCommentHistory,
  DeploymentAssessmentReviewHistory as DeploymentAssessmentReviewHistoryType,
} from '../../actions/deploymentAssessments'

const mockPatchResponse = vi.hoisted(() => vi.fn())

vi.mock('actions/response', () => ({
  patchResponse: mockPatchResponse,
}))

vi.mock('actions/review', () => ({
  postDeploymentAssessmentReviewComment: vi.fn(),
}))

vi.mock('actions/user', () => ({
  useGetCurrentUser: vi.fn(),
}))

vi.mock('src/common/RichTextEditor', () => ({
  default: ({ value, onChange, dataTest = 'richTextEditor' }: any) => (
    <textarea data-test={dataTest} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

vi.mock('src/common/MarkdownDisplay', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

vi.mock('src/common/UserAvatar', () => ({
  default: ({ entity }: { entity: { id: string } }) => <span>{`avatar:${entity.id}`}</span>,
}))

vi.mock('src/common/UserDisplay', () => ({
  default: ({ dn }: { dn: string }) => <span>{`user:${dn}`}</span>,
}))

vi.mock('src/reviews/ReactionButtons', () => ({
  default: ({ response, mutateResponses }: any) => (
    <button data-test={`reactionButtons-${response._id}`} onClick={mutateResponses}>
      Reactions
    </button>
  ),
}))

const comment: DeploymentAssessmentCommentHistory = {
  id: 'comment-id',
  entity: 'user:commenter',
  comment: 'A comment',
  reactions: [],
  commentEditedAt: '2026-01-03T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
}

const review: DeploymentAssessmentReviewHistoryType = {
  id: 'review-id',
  entity: 'user:reviewer',
  decision: 'approve',
  comment: 'Approved',
  reactions: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  outdated: true,
}

function renderComponent({
  comments = [comment],
  reviews = [review],
  isEdit = false,
}: {
  comments?: DeploymentAssessmentCommentHistory[]
  reviews?: DeploymentAssessmentReviewHistoryType[]
  isEdit?: boolean
} = {}) {
  const mutateComments = vi.fn()
  const mutateReviews = vi.fn()

  const view = render(
    <DeploymentAssessmentReviewHistoryComponent
      deploymentAssessmentId='assessment-id'
      comments={comments}
      reviews={reviews}
      isLoading={false}
      isEdit={isEdit}
      mutateComments={mutateComments}
      mutateReviews={mutateReviews}
    />,
  )

  return { ...view, mutateComments, mutateReviews }
}

describe('DeploymentAssessmentReviewHistory', () => {
  beforeEach(() => {
    vi.mocked(useGetCurrentUser).mockReturnValue({
      currentUser: { dn: 'commenter', isAdmin: false },
      isCurrentUserLoading: false,
      isCurrentUserError: undefined,
      mutateCurrentUser: vi.fn(),
    })
    vi.mocked(postDeploymentAssessmentReviewComment).mockReset()
    mockPatchResponse.mockReset()
  })

  test('displays comments and review decisions in chronological order', () => {
    const { container } = renderComponent()

    const content = container.textContent ?? ''
    expect(content.indexOf('Approved')).toBeLessThan(content.indexOf('A comment'))
    expect(screen.getByText('has approved')).toBeDefined()
    expect(screen.getByText('has left a comment')).toBeDefined()
    expect(screen.getByText('Outdated')).toBeDefined()
    expect(screen.getByText(/Edited /)).toBeDefined()
  })

  test('displays an empty history message', () => {
    renderComponent({ comments: [], reviews: [] })

    expect(screen.getByText('No responses found')).toBeDefined()
  })

  test('submits a comment and refreshes only comments', async () => {
    const user = userEvent.setup()
    const { mutateComments, mutateReviews } = renderComponent()
    vi.mocked(postDeploymentAssessmentReviewComment).mockResolvedValueOnce({ ok: true } as Response)

    const newCommentEditor = screen.getAllByTestId('richTextEditor')[0]
    await user.type(newCommentEditor, 'New comment')
    await user.click(screen.getByRole('button', { name: 'Add comment' }))

    await waitFor(() => {
      expect(postDeploymentAssessmentReviewComment).toHaveBeenCalledWith('assessment-id', 'New comment')
      expect(mutateComments).toHaveBeenCalledOnce()
    })
    expect(mutateReviews).not.toHaveBeenCalled()
    expect((newCommentEditor as HTMLTextAreaElement).value).toBe('')
  })

  test('creates a quoted reply in the comment editor', async () => {
    const user = userEvent.setup()
    renderComponent({ comments: [comment], reviews: [] })

    await user.click(screen.getByLabelText('Actions'))
    await user.click(await screen.findByRole('menuitem', { name: 'Reply' }))

    const newCommentEditor = screen.getAllByTestId('richTextEditor')[0]
    expect((newCommentEditor as HTMLTextAreaElement).value).toContain(
      '> Replying to **commenter** on **Fri Jan 02 2026**',
    )
    expect((newCommentEditor as HTMLTextAreaElement).value).toContain('>A comment')
  })

  test('edits an authored comment and refreshes only comments', async () => {
    const user = userEvent.setup()
    const { mutateComments, mutateReviews } = renderComponent({ comments: [comment], reviews: [] })
    mockPatchResponse.mockResolvedValueOnce({ ok: true } as Response)

    await user.click(screen.getByLabelText('Actions'))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

    const editor = screen.getAllByTestId('richTextEditor').at(-1)!
    await user.clear(editor)
    await user.type(editor, 'Updated comment')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockPatchResponse).toHaveBeenCalledWith('comment-id', 'Updated comment')
      expect(mutateComments).toHaveBeenCalledOnce()
    })
    expect(mutateReviews).not.toHaveBeenCalled()
  })

  test('refreshes the source history when reactions change', () => {
    const { mutateComments, mutateReviews } = renderComponent()

    fireEvent.click(screen.getByTestId('reactionButtons-comment-id'))
    expect(mutateComments).toHaveBeenCalledOnce()
    expect(mutateReviews).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('reactionButtons-review-id'))
    expect(mutateReviews).toHaveBeenCalledOnce()
  })
})
