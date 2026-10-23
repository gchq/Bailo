import { render, screen } from '@testing-library/react'
import DeploymentAssessments from 'pages/deployment-assessments/index'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/deployment-assessments/DeploymentAssessmentsList', () => ({
  default: () => <div data-testid='deploymentAssessmentsList' />,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, replace: vi.fn(), push: vi.fn() }),
}))

describe('DeploymentAssessments', () => {
  it('shows the deployment assessment list without tabs', () => {
    render(<DeploymentAssessments />)

    expect(screen.getByTestId('deploymentAssessmentsList')).toBeDefined()
    expect(screen.getByRole('button', { name: /Create deployment assessment/i })).toBeDefined()
    expect(screen.queryByText('All assessments')).toBeNull()
  })
})
