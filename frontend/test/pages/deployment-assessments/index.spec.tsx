import { render, screen, waitFor } from '@testing-library/react'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import DeploymentAssessments from 'pages/deployment-assessments/index'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { DeploymentAssessmentSummary, UiConfig } from 'types/types'
import { describe, expect, it, vi } from 'vitest'

vi.mock('actions/deploymentAssessments', () => ({
  useGetDeploymentAssessments: vi.fn(),
}))

vi.mock('src/deployment-assessments/NeedsAction', () => ({
  default: () => <div data-test='needsAction' />,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, replace: vi.fn(), push: vi.fn() }),
}))

const testUiConfig = { roleDisplayNames: { riskOwner: 'Deployment Risk Owner' } } as UiConfig

const testDeploymentAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'A Model to make everything',
  draft: true,
  createdBy: 'creator',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function renderPage(deploymentAssessments: DeploymentAssessmentSummary[]) {
  vi.mocked(useGetDeploymentAssessments).mockReturnValue({
    deploymentAssessments,
    isDeploymentAssessmentsLoading: false,
    isDeploymentAssessmentsError: undefined,
    mutateDeploymentAssessments: vi.fn(),
  })

  return render(
    <UiConfigContext.Provider value={testUiConfig}>
      <DeploymentAssessments />
    </UiConfigContext.Provider>,
  )
}

describe('DeploymentAssessments', () => {
  it('counts the assessments needing action on the tab', async () => {
    renderPage([testDeploymentAssessment, { ...testDeploymentAssessment, id: 'assessment-def456' }])

    await waitFor(async () => {
      expect(await screen.findByText('Needs action (2)')).toBeDefined()
    })
  })

  it('omits the count when nothing needs action', async () => {
    renderPage([])

    await waitFor(async () => {
      expect(await screen.findByText('Needs action')).toBeDefined()
    })
  })

  it('only counts the assessments that need action', async () => {
    renderPage([])

    expect(useGetDeploymentAssessments).toHaveBeenCalledWith({ needsAction: true })
  })
})
