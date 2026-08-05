import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import { ReviewStatusProps } from 'src/entry/model/reviews/ReviewDisplay'
import { lightTheme } from 'src/theme'
import {
  testAccessRequest,
  testAccessRequestReview,
  testAccessRequestWithComments,
  testComment,
} from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('actions/review', () => ({
  useGetReviewRequestsForModel: vi.fn(),
}))

vi.mock('actions/response', () => ({
  useGetResponses: vi.fn(),
}))

vi.mock('src/entry/model/reviews/ReviewStatus.tsx', () => ({ default: (_props: ReviewStatusProps) => <></> }))

describe('ReviewFooter', () => {
  it('displays comment icon when there are comments', async () => {
    vi.mocked(useGetReviewRequestsForModel).mockReturnValue({
      reviews: [testAccessRequestReview],
      isReviewsLoading: false,
      isReviewsError: undefined,
      mutateReviews: vi.fn(),
    })
    vi.mocked(useGetResponses).mockReturnValue({
      responses: [testComment],
      isResponsesLoading: false,
      isResponsesError: undefined,
      mutateResponses: vi.fn(),
    })
    render(
      <ThemeProvider theme={lightTheme}>
        <ReleaseAccessRequestReviewSummary accessRequest={testAccessRequestWithComments} />
      </ThemeProvider>,
    )
    await waitFor(async () => {
      expect(await screen.findByTestId('commentCount')).toBeDefined()
    })
  })

  it('does not display comment icon when there are not comments', async () => {
    vi.mocked(useGetReviewRequestsForModel).mockReturnValue({
      reviews: [testAccessRequestReview],
      isReviewsLoading: false,
      isReviewsError: undefined,
      mutateReviews: vi.fn(),
    })
    vi.mocked(useGetResponses).mockReturnValue({
      responses: [],
      isResponsesLoading: false,
      isResponsesError: undefined,
      mutateResponses: vi.fn(),
    })
    render(
      <ThemeProvider theme={lightTheme}>
        <ReleaseAccessRequestReviewSummary accessRequest={testAccessRequest} />
      </ThemeProvider>,
    )
    await waitFor(async () => {
      const commentsIcon = screen.queryByTestId('commentIcon')
      const commentCount = screen.queryByTestId('commentCount')
      expect(commentsIcon).toBeNull()
      expect(commentCount).toBeNull()
    })
  })
})
