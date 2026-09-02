import { render, screen, waitFor } from '@testing-library/react'
import { useGetCurrentUser, useGetUserInformation } from 'actions/user'
import DeploymentAssessmentItem from 'src/deployment-assessments/DeploymentAssessmentItem'
import { DeploymentAssessmentSummary } from 'types/types'
import { testUserInformation } from 'utils/test/testModels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/user', () => ({
  useGetUserInformation: vi.fn(),
  useGetCurrentUser: vi.fn(),
}))

const testDeploymentAssessment: DeploymentAssessmentSummary = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'A Model to make everything',
  owner: ['user:risk-owner'],
  models: ['model-one'],
  justification: 'A deployment that makes everything',
  draft: false,
  createdBy: 'creator',
  createdAt: '2026-01-01T00:00:00.000Z',
  state: 'needs_review',
}

function mockCurrentUser(dn?: string) {
  vi.mocked(useGetCurrentUser).mockReturnValue({
    currentUser: dn ? { dn, isAdmin: false } : undefined,
    isCurrentUserLoading: false,
    isCurrentUserError: undefined,
    mutateCurrentUser: vi.fn(),
  })
}

describe('DeploymentAssessmentItem', () => {
  beforeEach(() => {
    vi.mocked(useGetUserInformation).mockReturnValue({
      userInformation: testUserInformation,
      isUserInformationLoading: false,
      isUserInformationError: undefined,
      mutateUserInformation: vi.fn(),
    })
    mockCurrentUser()
  })

  it('links to the deployment assessment page', async () => {
    render(<DeploymentAssessmentItem deploymentAssessment={testDeploymentAssessment} />)

    const link = await screen.findByRole('link', { name: 'View deployment assessment A Model to make everything' })
    expect(link.getAttribute('href')).toBe('/deployment-assessments/assessment-abc123')
  })

  it('shows the name, justification and both parties', async () => {
    render(<DeploymentAssessmentItem deploymentAssessment={testDeploymentAssessment} />)

    await waitFor(async () => {
      expect(await screen.findByText('A Model to make everything')).toBeDefined()
      expect(await screen.findByText('A deployment that makes everything')).toBeDefined()
      expect(await screen.findByText('Risk owner')).toBeDefined()
      expect(await screen.findByText('Created by')).toBeDefined()
    })
  })

  it.each([
    ['needs_review', 'Awaiting review'],
    ['changes_requested', 'Changes requested'],
    ['rejected', 'Rejected'],
    ['approved', 'Approved'],
  ])('shows the %s state as "%s"', async (state, label) => {
    render(
      <DeploymentAssessmentItem
        deploymentAssessment={{
          ...testDeploymentAssessment,
          state: state as DeploymentAssessmentSummary['state'],
        }}
      />,
    )

    await waitFor(async () => {
      expect(await screen.findByText(label)).toBeDefined()
    })
  })

  it('shows a draft as a draft regardless of state', async () => {
    render(
      <DeploymentAssessmentItem
        deploymentAssessment={{ ...testDeploymentAssessment, draft: true, state: undefined }}
      />,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Draft')).toBeDefined()
    })
  })

  it('shows the review date when the assessment has been reviewed', async () => {
    render(
      <DeploymentAssessmentItem
        deploymentAssessment={{
          ...testDeploymentAssessment,
          state: 'rejected',
          reviewedAt: '2026-02-03T00:00:00.000Z',
        }}
      />,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Review date')).toBeDefined()
      expect(await screen.findByText('03/02/2026')).toBeDefined()
    })
  })

  it('omits the risk owner and review date when they are not set', async () => {
    render(
      <DeploymentAssessmentItem
        deploymentAssessment={{ ...testDeploymentAssessment, owner: undefined, reviewedAt: undefined }}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText('Risk owner')).toBeNull()
      expect(screen.queryByText('Review date')).toBeNull()
    })
  })

  it('highlights the current user when they are the risk owner', async () => {
    mockCurrentUser('risk-owner')
    render(<DeploymentAssessmentItem deploymentAssessment={testDeploymentAssessment} />)

    await waitFor(async () => {
      expect(await screen.findByText('Joe Bloggs (you)')).toBeDefined()
    })
  })

  it('highlights the current user when they are the creator', async () => {
    mockCurrentUser('creator')
    render(<DeploymentAssessmentItem deploymentAssessment={testDeploymentAssessment} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('creator (you)')).toBeDefined()
    })
  })

  it('does not highlight anybody when the user is neither party', async () => {
    mockCurrentUser('somebody-else')
    render(<DeploymentAssessmentItem deploymentAssessment={testDeploymentAssessment} />)

    await waitFor(() => {
      expect(screen.queryByText('Joe Bloggs (you)')).toBeNull()
      expect(screen.queryByLabelText('creator (you)')).toBeNull()
    })
  })
})
