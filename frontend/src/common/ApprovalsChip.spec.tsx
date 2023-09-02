import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetVersionOrDeploymentApprovals } from '../../data/approvals'
import { ApprovalCategory } from '../../types/types'
import {
  testApproval1,
  testApproval2,
  testApproval3,
  testApproval4,
  testId,
  testUser,
} from '../../utils/test/testModels'
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

describe('ApprovalsChip', () => {
  it('renders an ApprovalsChip component with 0/2 approvals', async () => {
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
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 0/2')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 1/2 approvals', async () => {
    const mockUseGetVersionOrDeploymentApprovals = {
      approvals: [testApproval1, testApproval3],
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
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 1/2')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 2/2 approvals', async () => {
    const mockUseGetVersionOrDeploymentApprovals = {
      approvals: [testApproval3, testApproval4],
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
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 2/2')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 0/1 approvals', async () => {
    const mockUseGetVersionOrDeploymentApprovals = {
      approvals: [testApproval1],
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
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 0/1')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 1/1 approvals', async () => {
    const mockUseGetVersionOrDeploymentApprovals = {
      approvals: [testApproval3],
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
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 1/1')).not.toBeUndefined()
    })
  })
})
