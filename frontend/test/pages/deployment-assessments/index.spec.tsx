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
  it('shows the Deployment Assessment list without tabs', () => {
    render(<DeploymentAssessments />)

    expect(screen.getByTestId('deploymentAssessmentsList')).toBeDefined()
    expect(screen.getByRole('button', { name: /Create Deployment Assessment/i })).toBeDefined()
    expect(screen.queryByText('All assessments')).toBeNull()
  })

  it('links the help icon to the Deployment Assessments documentation in a new tab', () => {
    render(<DeploymentAssessments />)

    const helpLink = screen.getByRole('link', { name: 'What are Deployment Assessments?' })

    expect(helpLink.getAttribute('href')).toBe('/docs/users/using-a-model/deployment-assessments')
    expect(helpLink.getAttribute('target')).toBe('_blank')
    expect(helpLink.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
