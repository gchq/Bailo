import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { UserDisplayProps } from 'src/common/UserDisplay'
import AccessRequestDisplay from 'src/model/beta/accessRequests/AccessRequestDisplay'
import { ReviewBannerProps } from 'src/model/beta/reviews/ReviewBanner'
import { ReviewDisplayProps } from 'src/model/beta/reviews/ReviewDisplay'
import { lightTheme } from 'src/theme'
import { testAccessRequest, testAccessRequestReview } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

import { useGetReviewRequestsForModel } from '../../../actions/review'

vi.mock('../../../actions/review', () => ({
  useGetReviewRequestsForModel: vi.fn(),
}))
vi.mock('src/model/beta/reviews/ReviewBanner.tsx', () => ({ default: (_props: ReviewBannerProps) => <></> }))
vi.mock('src/common/UserDisplay.tsx', () => ({ default: (_props: UserDisplayProps) => <></> }))
vi.mock('src/model/beta/reviews/ReviewDisplay.tsx', () => ({ default: (_props: ReviewDisplayProps) => <></> }))

describe('AccessRequestDisplay', () => {
  it('renders a AccessRequestDisplay component', async () => {
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
      expect(await screen.findByText(testAccessRequest.metadata.overview.name)).not.toBeUndefined()
    })
  })
})
