import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import CurrentUserContext from 'src/contexts/currentUserContext'
import MyAssessments from 'src/deployment-assessments/MyAssessments'
import { DeploymentAssessmentState, DeploymentAssessmentSummary, UserV3 } from 'types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/deploymentAssessments', () => ({
  useGetDeploymentAssessments: vi.fn(),
}))

vi.mock('src/common/UserDisplay', () => ({
  default: ({ dn }: { dn: string }) => <span>{dn}</span>,
}))

vi.mock('src/storage/userPreferences', () => ({
  getHiddenDeploymentAssessmentColumns: vi.fn(() => []),
  saveHiddenDeploymentAssessmentColumns: vi.fn(),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, replace: vi.fn(), push: vi.fn() }),
}))

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        return undefined
      }
      disconnect() {
        return undefined
      }
    },
  )
})

const testUser: UserV3 = { dn: 'user-abc123' } as UserV3

const draftAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-001',
  schemaId: 'deployment-assessment-schema',
  name: 'Draft Assessment',
  draft: true,
  createdBy: 'user-abc123',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const approvedAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-002',
  schemaId: 'deployment-assessment-schema',
  name: 'Approved Assessment',
  draft: false,
  state: DeploymentAssessmentState.Approved,
  owner: ['risk-owner-dn'],
  models: ['model-a'],
  createdBy: 'user-abc123',
  createdAt: '2026-01-02T00:00:00.000Z',
}

const needsReviewAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-003',
  schemaId: 'deployment-assessment-schema',
  name: 'Needs Review Assessment',
  draft: false,
  state: DeploymentAssessmentState.NeedsReview,
  owner: ['risk-owner-dn'],
  models: ['model-b'],
  createdBy: 'user-abc123',
  createdAt: '2026-01-03T00:00:00.000Z',
}

function renderComponent(assessments: DeploymentAssessmentSummary[]) {
  vi.mocked(useGetDeploymentAssessments).mockReturnValue({
    deploymentAssessments: assessments,
    isDeploymentAssessmentsLoading: false,
    isDeploymentAssessmentsError: undefined,
    mutateDeploymentAssessments: vi.fn(),
  })

  return render(
    <CurrentUserContext.Provider value={testUser}>
      <MyAssessments />
    </CurrentUserContext.Provider>,
  )
}

describe('MyAssessments', () => {
  it('filters assessments by the current user', () => {
    renderComponent([])

    expect(useGetDeploymentAssessments).toHaveBeenCalledWith(expect.objectContaining({ createdBy: testUser.dn }))
  })

  it('renders all swim-lane columns', async () => {
    renderComponent([])

    await waitFor(() => {
      expect(screen.getByText(/In Draft/i)).toBeDefined()
      expect(screen.getByText(/Needs Review/i)).toBeDefined()
      expect(screen.getByText(/Changes Requested/i)).toBeDefined()
      expect(screen.getByText(/Rejected/i)).toBeDefined()
      expect(screen.getByText(/Approved/i)).toBeDefined()
    })
  })

  it('places a draft assessment in the In Draft column', async () => {
    renderComponent([draftAssessment])

    await waitFor(() => {
      expect(screen.getByText('Draft Assessment')).toBeDefined()
    })

    const inDraftColumn = screen.getByText(/In Draft \(1\)/i).closest('div')?.parentElement
    expect(inDraftColumn?.textContent).toContain('Draft Assessment')
  })

  it('places an approved assessment in the Approved column', async () => {
    renderComponent([approvedAssessment])

    await waitFor(() => {
      expect(screen.getByText('Approved Assessment')).toBeDefined()
    })

    const approvedColumn = screen.getByText(/Approved \(1\)/i).closest('div')?.parentElement
    expect(approvedColumn?.textContent).toContain('Approved Assessment')
  })

  it('shows the correct item count in each column header', async () => {
    renderComponent([draftAssessment, needsReviewAssessment])

    await waitFor(() => {
      expect(screen.getByText(/In Draft \(1\)/i)).toBeDefined()
      expect(screen.getByText(/Needs Review \(1\)/i)).toBeDefined()
      expect(screen.getByText(/Approved \(0\)/i)).toBeDefined()
    })
  })

  it('shows an empty state when there are no assessments in a column', async () => {
    renderComponent([])

    await waitFor(() => {
      const emptyMessages = screen.getAllByText('No assessments')
      expect(emptyMessages.length).toBeGreaterThan(0)
    })
  })

  it('hides a column when the hide button is clicked', async () => {
    const user = userEvent.setup()
    renderComponent([])

    const hideButton = screen.getByRole('button', { name: /Hide In Draft column/i })
    await user.click(hideButton)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Hide In Draft column/i })).toBeNull()
    })
  })

  it('shows a hidden column chip when a column is hidden', async () => {
    const user = userEvent.setup()
    renderComponent([draftAssessment])

    const hideButton = screen.getByRole('button', { name: /Hide In Draft column/i })
    await user.click(hideButton)

    await waitFor(() => {
      expect(screen.getByText(/In Draft \(1\)/i)).toBeDefined()
    })
  })

  it('restores a hidden column when its chip cancel icon is clicked', async () => {
    const user = userEvent.setup()
    renderComponent([])

    const hideButton = screen.getByRole('button', { name: /Hide In Draft column/i })
    await user.click(hideButton)

    const chip = await screen.findByRole('button', { name: /In Draft/i })
    const cancelIcon = chip.querySelector('[data-testid="CancelIcon"]')
    expect(cancelIcon).not.toBeNull()
    await user.click(cancelIcon!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Hide In Draft column/i })).toBeDefined()
    })
  })

  it('shows all columns after clicking "Show all columns"', async () => {
    const user = userEvent.setup()
    renderComponent([])

    await user.click(screen.getByRole('button', { name: /Hide In Draft column/i }))

    const showAllButton = screen.getByRole('button', { name: /Show all columns/i })
    await user.click(showAllButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Hide In Draft column/i })).toBeDefined()
    })
  })

  it('disables "Hide empty columns" when there are no empty visible columns', async () => {
    renderComponent([
      draftAssessment,
      approvedAssessment,
      needsReviewAssessment,
      {
        ...approvedAssessment,
        id: 'assessment-cr',
        name: 'Changes Requested Assessment',
        state: DeploymentAssessmentState.ChangesRequested,
      },
      {
        ...approvedAssessment,
        id: 'assessment-rej',
        name: 'Rejected Assessment',
        state: DeploymentAssessmentState.Rejected,
      },
    ])

    await waitFor(() => {
      const hideEmptyButton = screen.getByRole('button', { name: /Hide empty columns/i })
      expect((hideEmptyButton as HTMLButtonElement).disabled).toBe(true)
    })
  })
})
