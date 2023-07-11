import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetVersionOrDeploymentApprovals } from '../../data/approvals'
import { ApprovalCategory } from '../../types/types'
import { testApproval1, testApproval2, testId, testUser } from '../../utils/testUtils'
import { lightTheme } from '../theme'
import ApprovalsChip from './ApprovalsChip'

vi.mock('../../data/approvals', () => ({
  useGetVersionOrDeploymentApprovals: vi.fn(),
  useGetNumApprovals: vi.fn().mockReturnValue({
    numApprovals: 2,
    isNumApprovalsLoading: false,
    isNumApprovalsError: undefined,
    mutateNumApprovals: vi.fn(),
  }),
}))

vi.mock('../../utils/fetcher', () => ({
  getErrorMessage: vi.fn().mockResolvedValue('Test error message'),
}))

vi.mock('../../data/api', () => ({
  postEndpoint: vi.fn(),
}))

describe('ApprovalsChip', () => {
  it.only('renders an ApprovalsChip component with 0/2 approvals', async () => {
    const mockUseGetVersionOrDeploymentApprovals = {
      approvals: [testApproval1, testApproval2],
      isApprovalsLoading: false,
      isApprovalsError: undefined,
      mutateApprovals: vi.fn(),
    }

    vi.mocked(useGetVersionOrDeploymentApprovals).mockReturnValue(mockUseGetVersionOrDeploymentApprovals)

    render(
      <ThemeProvider theme={lightTheme}>
        <ApprovalsChip
          versionOrDeploymentId={testId}
          approvalCategory={ApprovalCategory.Upload}
          currentUser={testUser}
        />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 0/2')).not.toBeUndefined()
    })
  })

  // it('renders an ApprovalsChip component with 1/2 approvals', async () => {
  //   render(
  //     <ThemeProvider theme={lightTheme}>
  //       <ApprovalsChip
  //         approvals={[
  //           { reviewers: [{ kind: EntityKind.USER, id: 'Alice' }], status: ApprovalStates.Accepted },
  //           { reviewers: [{ kind: EntityKind.USER, id: 'Bob' }], status: ApprovalStates.NoResponse },
  //         ]}
  //       />
  //     </ThemeProvider>
  //   )

  //   await waitFor(async () => {
  //     expect(await screen.findByText('Approvals 1/2')).not.toBeUndefined()
  //   })
  // })

  // it('renders an ApprovalsChip component with 2/2 approvals', async () => {
  //   render(
  //     <ThemeProvider theme={lightTheme}>
  //       <ApprovalsChip
  //         approvals={[
  //           { reviewers: [{ kind: EntityKind.USER, id: 'Alice' }], status: ApprovalStates.Accepted },
  //           { reviewers: [{ kind: EntityKind.USER, id: 'Bob' }], status: ApprovalStates.Accepted },
  //         ]}
  //       />
  //     </ThemeProvider>
  //   )

  //   await waitFor(async () => {
  //     expect(await screen.findByText('Approvals 2/2')).not.toBeUndefined()
  //   })
  // })

  // it('renders an ApprovalsChip component with 0/1 approvals', async () => {
  //   render(
  //     <ThemeProvider theme={lightTheme}>
  //       <ApprovalsChip
  //         approvals={[{ reviewers: [{ kind: EntityKind.USER, id: 'Alice' }], status: ApprovalStates.NoResponse }]}
  //       />
  //     </ThemeProvider>
  //   )

  //   await waitFor(async () => {
  //     expect(await screen.findByText('Approvals 0/1')).not.toBeUndefined()
  //   })
  // })

  // it('renders an ApprovalsChip component with 1/1 approvals', async () => {
  //   render(
  //     <ThemeProvider theme={lightTheme}>
  //       <ApprovalsChip
  //         approvals={[{ reviewers: [{ kind: EntityKind.USER, id: 'Alice' }], status: ApprovalStates.Accepted }]}
  //       />
  //     </ThemeProvider>
  //   )

  //   await waitFor(async () => {
  //     expect(await screen.findByText('Approvals 1/1')).not.toBeUndefined()
  //   })
  // })
})
