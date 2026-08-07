import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { UserDisplayProps } from 'src/common/UserDisplay'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import { ReleaseAccessRequestReviewSummaryProps } from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import { ReviewBannerProps } from 'src/entry/model/reviews/ReviewBanner'
import { ReviewDisplayProps } from 'src/entry/model/reviews/ReviewDisplay'
import { lightTheme } from 'src/theme'
import { formatDateString } from 'utils/dateUtils'
import { testAccessRequest } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/entry/model/reviews/ReviewBanner.tsx', () => ({ default: (_props: ReviewBannerProps) => <></> }))
vi.mock('src/common/UserDisplay.tsx', () => ({ default: (_props: UserDisplayProps) => <></> }))
vi.mock('src/entry/model/reviews/ReviewDisplay.tsx', () => ({
  default: (_props: ReviewDisplayProps) => <></>,
}))
vi.mock('src/entry/model/reviews/ReviewFooter.tsx', () => ({
  default: (_props: ReleaseAccessRequestReviewSummaryProps) => <></>,
}))

describe('AccessRequestDisplay', () => {
  it('displays access request metadata when not loading and no errors', async () => {
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
})
