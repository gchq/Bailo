import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { UserDisplayProps } from 'src/common/UserDisplay'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import { ReviewBannerProps } from 'src/entry/model/reviews/ReviewBanner'
import { ReviewDisplayProps } from 'src/entry/model/reviews/ReviewDisplay'
import { lightTheme } from 'src/theme'
import { formatDateString } from 'utils/dateUtils'
import { testAccessRequest, testAccessRequestReview, testAccessRequestWithComments } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

import { useGetReviewRequestsForModel } from '../../../actions/review'

vi.mock('../../../actions/review', () => ({
  useGetReviewRequestsForModel: vi.fn(),
}))
vi.mock('src/model/reviews/ReviewBanner.tsx', () => ({ default: (_props: ReviewBannerProps) => <></> }))
vi.mock('src/common/UserDisplay.tsx', () => ({ default: (_props: UserDisplayProps) => <></> }))
vi.mock('src/model/reviews/ReviewDisplay.tsx', () => ({ default: (_props: ReviewDisplayProps) => <></> }))

describe('AccessRequestDisplay', () => {
  it('displays access request metadata when not loading and no errors', async () => {
    vi.mocked(useGetReviewRequestsForModel).mockReturnValue({
      reviews: [testAccessRequestReview],
      isReviewsLoading: false,
      isReviewsError: undefined,
      mutateReviews: vi.fn(),
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
