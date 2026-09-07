import { render, screen, waitFor } from '@testing-library/react'
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
})
