import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { UserDisplayProps } from 'src/common/UserDisplay'
import AccessRequestDisplay from 'src/model/beta/accessRequests/AccessRequestDisplay'
import { ReviewBannerProps } from 'src/model/beta/reviews/ReviewBanner'
import { ReviewDisplayProps } from 'src/model/beta/reviews/ReviewDisplay'
import { lightTheme } from 'src/theme'
import { formatDateString } from 'utils/dateUtils'
import { testAccessRequest, testAccessRequestReview, testAccessRequestWithComments } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

import { useGetReviewRequestsForModel } from '../../../actions/review'

vi.mock('../../../actions/review', () => ({
  useGetReviewRequestsForModel: vi.fn(),
}))
vi.mock('src/model/beta/reviews/ReviewBanner.tsx', () => ({ default: (_props: ReviewBannerProps) => <></> }))
vi.mock('src/common/UserDisplay.tsx', () => ({ default: (_props: UserDisplayProps) => <></> }))
vi.mock('src/model/beta/reviews/ReviewDisplay.tsx', () => ({ default: (_props: ReviewDisplayProps) => <></> }))

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
    const accessRequestEndDate = await screen.findByTestId('accessRequestEndDate')
    await waitFor(async () => {
      expect(await screen.findByText(testAccessRequest.metadata.overview.name)).toBeDefined()
      expect(accessRequestEndDate.innerHTML).toBe(
        ` ${formatDateString(testAccessRequest.metadata.overview.endDate as string)}`,
      )
      expect(await screen.findByText(testAccessRequest.metadata.overview.entities[0].split(':')[1])).toBeDefined()
    })
  })

  it('displays a comments icon when the provided access request has comment responses', async () => {
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
      expect(await screen.findByText('1 comment')).toBeDefined()
    })
  })

  it('does not display a comments icon when the provided access request has no comment responses', async () => {
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
      const commentsIcon = screen.queryByLabelText('Comments')
      const commentCount = screen.queryByText('1 comment')
      expect(commentsIcon).toBeNull()
      expect(commentCount).toBeNull()
    })
  })
})
