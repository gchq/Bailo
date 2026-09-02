import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import NeedsAction from 'src/deployment-assessments/NeedsAction'
import { DeploymentAssessmentSummary } from 'types/types'
import { describe, expect, it, vi } from 'vitest'

vi.mock('actions/deploymentAssessments', () => ({
  useGetDeploymentAssessments: vi.fn(),
}))

vi.mock('src/deployment-assessments/DeploymentAssessmentItem', () => ({
  default: ({ deploymentAssessment }: { deploymentAssessment: DeploymentAssessmentSummary }) => (
    <div data-test='deploymentAssessmentItem'>{deploymentAssessment.name}</div>
  ),
}))

const testDeploymentAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'A Model to make everything',
  draft: true,
  createdBy: 'creator',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function mockDeploymentAssessments(deploymentAssessments: DeploymentAssessmentSummary[]) {
  vi.mocked(useGetDeploymentAssessments).mockReturnValue({
    deploymentAssessments,
    isDeploymentAssessmentsLoading: false,
    isDeploymentAssessmentsError: undefined,
    mutateDeploymentAssessments: vi.fn(),
  })
}

describe('NeedsAction', () => {
  it('shows a message when nothing needs the user to act', async () => {
    mockDeploymentAssessments([])
    render(<NeedsAction />)

    await waitFor(async () => {
      expect(await screen.findByText('No deployment assessments need your action')).toBeDefined()
    })
  })

  it('shows an item for each deployment assessment', async () => {
    mockDeploymentAssessments([
      testDeploymentAssessment,
      { ...testDeploymentAssessment, id: 'assessment-def456', name: 'Translation Engine of Somesort' },
    ])
    render(<NeedsAction />)

    await waitFor(async () => {
      expect(await screen.findAllByTestId('deploymentAssessmentItem')).toHaveLength(2)
      expect(await screen.findByText('A Model to make everything')).toBeDefined()
      expect(await screen.findByText('Translation Engine of Somesort')).toBeDefined()
    })
  })

  it('only requests the assessments that need the user to act', async () => {
    mockDeploymentAssessments([])
    render(<NeedsAction />)

    expect(useGetDeploymentAssessments).toHaveBeenCalledWith({ needsAction: true })
  })

  describe('status filter', () => {
    const draft = testDeploymentAssessment
    const rejected: DeploymentAssessmentSummary = {
      ...testDeploymentAssessment,
      id: 'assessment-def456',
      name: 'Translation Engine of Somesort',
      draft: false,
      state: 'rejected',
    }

    it('offers a chip for each status that is present', async () => {
      mockDeploymentAssessments([draft, rejected])
      render(<NeedsAction />)

      await waitFor(async () => {
        expect(await screen.findByTestId('chipOption-Draft')).toBeDefined()
        expect(await screen.findByTestId('chipOption-Rejected')).toBeDefined()
        expect(screen.queryByTestId('chipOption-Approved')).toBeNull()
      })
    })

    it('names each chip after the status it filters by', async () => {
      mockDeploymentAssessments([draft, rejected])
      render(<NeedsAction />)

      await waitFor(async () => {
        expect(await screen.findByLabelText('Filter by status: Draft')).toBeDefined()
        expect(await screen.findByLabelText('Filter by status: Rejected')).toBeDefined()
      })
    })

    it('hides the filter when there is nothing to choose between', async () => {
      mockDeploymentAssessments([draft])
      render(<NeedsAction />)

      await waitFor(() => {
        expect(screen.queryByTestId('chipOption-Draft')).toBeNull()
      })
    })

    it('narrows the list to the selected status', async () => {
      mockDeploymentAssessments([draft, rejected])
      render(<NeedsAction />)

      fireEvent.click(await screen.findByTestId('chipOption-Rejected'))

      await waitFor(async () => {
        expect(await screen.findAllByTestId('deploymentAssessmentItem')).toHaveLength(1)
        expect(await screen.findByText('Translation Engine of Somesort')).toBeDefined()
        expect(screen.queryByText('A Model to make everything')).toBeNull()
      })
    })

    it('drops a selected status that is no longer on offer', async () => {
      mockDeploymentAssessments([draft, rejected])
      const { rerender } = render(<NeedsAction />)

      fireEvent.click(await screen.findByTestId('chipOption-Rejected'))
      await waitFor(async () => expect(await screen.findAllByTestId('deploymentAssessmentItem')).toHaveLength(1))

      // The rejected assessment is actioned elsewhere and disappears on the next revalidation
      mockDeploymentAssessments([draft])
      rerender(<NeedsAction />)

      await waitFor(async () => {
        expect(await screen.findAllByTestId('deploymentAssessmentItem')).toHaveLength(1)
        expect(await screen.findByText('A Model to make everything')).toBeDefined()
        expect(screen.queryByText('No deployment assessments match the selected statuses')).toBeNull()
      })
    })

    it('shows every assessment again once the status is deselected', async () => {
      mockDeploymentAssessments([draft, rejected])
      render(<NeedsAction />)

      const rejectedChip = await screen.findByTestId('chipOption-Rejected')
      fireEvent.click(rejectedChip)
      fireEvent.click(rejectedChip)

      await waitFor(async () => {
        expect(await screen.findAllByTestId('deploymentAssessmentItem')).toHaveLength(2)
      })
    })
  })
})
