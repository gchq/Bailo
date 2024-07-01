import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import { UserDisplayProps } from 'src/common/UserDisplay'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import { ReviewBannerProps } from 'src/entry/model/reviews/ReviewBanner'
import { ReviewDisplayProps } from 'src/entry/model/reviews/ReviewDisplay'
import { lightTheme } from 'src/theme'
import { formatDateString } from 'utils/dateUtils'
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

vi.mock('src/entry/model/reviews/ReviewBanner.tsx', () => ({ default: (_props: ReviewBannerProps) => <></> }))
vi.mock('src/common/UserDisplay.tsx', () => ({ default: (_props: UserDisplayProps) => <></> }))
vi.mock('src/entry/model/reviews/ReviewDisplay.tsx', () => ({ default: (_props: ReviewDisplayProps) => <></> }))

describe('AccessRequestDisplay', () => {
  it('displays access request metadata when not loading and no errors', async () => {
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
        <AccessRequestDisplay accessRequest={testAccessRequest} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      const accessRequestEndDate = await screen.findByTestId('accessRequestEndDate')
      expect(await screen.findByText(testAccessRequest.metadata.overview.name)).toBeDefined()
      expect(accessRequestEndDate.innerHTML).toBe(
        ` ${formatDateString(testAccessRequest.metadata.overview.endDate as string)}`,
      )
    })
  })

  it('displays comment icon when access request has comments', async () => {
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
        <AccessRequestDisplay accessRequest={testAccessRequestWithComments} />
      </ThemeProvider>,
    )
    await waitFor(async () => {
      expect(await screen.findByTestId('commentCount')).toBeDefined()
    })
  })

  it('does not display comment icon when access request does not have comments', async () => {
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
        <AccessRequestDisplay accessRequest={testAccessRequest} />
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
