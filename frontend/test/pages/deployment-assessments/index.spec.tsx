import { fireEvent, render, screen } from '@testing-library/react'
import DeploymentAssessments from 'pages/deployment-assessments/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const noSchemasTooltip = 'No Deployment Assessment schemas are available. Contact an administrator to add one.'

const schemaMocks = vi.hoisted(() => ({
  useGetSchemas: vi.fn(),
}))

vi.mock('actions/schema', () => ({
  useGetSchemas: schemaMocks.useGetSchemas,
}))

vi.mock('src/deployment-assessments/DeploymentAssessmentsList', () => ({
  default: () => <div data-testid='deploymentAssessmentsList' />,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, replace: vi.fn(), push: vi.fn() }),
}))

describe('DeploymentAssessments', () => {
  beforeEach(() => {
    schemaMocks.useGetSchemas.mockReturnValue({
      schemas: [{ id: 'deployment-assessment-schema' }],
      isSchemasLoading: false,
      isSchemasError: undefined,
    })
  })

  it('shows the Deployment Assessment list without tabs', () => {
    render(<DeploymentAssessments />)

    expect(screen.getByTestId('deploymentAssessmentsList')).toBeDefined()
    expect(screen.getByRole('button', { name: /Create Deployment Assessment/i })).toBeDefined()
    expect(screen.queryByText('All assessments')).toBeNull()
  })

  it('requests only non-hidden Deployment Assessment schemas', () => {
    render(<DeploymentAssessments />)

    expect(schemaMocks.useGetSchemas).toHaveBeenCalledWith('deploymentAssessment', false)
  })

  it('enables the create button when Deployment Assessment schemas are available', () => {
    render(<DeploymentAssessments />)

    const button = screen.getByRole('button', { name: /Create Deployment Assessment/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })

  it('disables the create button and explains why when no Deployment Assessment schemas are available', async () => {
    schemaMocks.useGetSchemas.mockReturnValue({ schemas: [], isSchemasLoading: false, isSchemasError: undefined })

    render(<DeploymentAssessments />)

    const button = screen.getByRole('button', { name: /Create Deployment Assessment/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(await screen.findByText(noSchemasTooltip)).toBeDefined()
  })

  it('disables the create button without a tooltip while schemas are loading', () => {
    schemaMocks.useGetSchemas.mockReturnValue({ schemas: [], isSchemasLoading: true, isSchemasError: undefined })

    render(<DeploymentAssessments />)

    const button = screen.getByRole('button', { name: /Create Deployment Assessment/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(screen.queryByText(noSchemasTooltip)).toBeNull()
  })

  it('leaves the create button enabled if schemas fail to load', () => {
    schemaMocks.useGetSchemas.mockReturnValue({
      schemas: [],
      isSchemasLoading: false,
      isSchemasError: { status: 500, info: { message: 'error' } },
    })

    render(<DeploymentAssessments />)

    const button = screen.getByRole('button', { name: /Create Deployment Assessment/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })

  it('links the help icon to the Deployment Assessments documentation in a new tab', () => {
    render(<DeploymentAssessments />)

    const helpLink = screen.getByRole('link', { name: 'What are Deployment Assessments?' })

    expect(helpLink.getAttribute('href')).toBe('/docs/users/using-a-model/deployment-assessments')
    expect(helpLink.getAttribute('target')).toBe('_blank')
    expect(helpLink.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
