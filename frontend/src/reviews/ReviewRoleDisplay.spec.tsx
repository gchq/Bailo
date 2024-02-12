import { render, screen, waitFor } from '@testing-library/react'
import { useGetModelRoles } from 'actions/model'
import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
import { testAccessRequestReviewNoResponses, testManagerRole } from 'utils/test/testModels'
import { describe, expect, vi } from 'vitest'

const mockRoleUtils = vi.hoisted(() => {
  return {
    getRoleDisplay: vi.fn(),
  }
})
vi.mock('utils/beta/roles.ts', () => mockRoleUtils)

vi.mock('actions/model', () => ({
  useGetModelRoles: vi.fn(),
}))

describe('ReviewRoleDisplay', () => {
  const testMessage = 'This access needs to be reviewed by the Manager.'

  //do test to make sure that message should/does not show
  it('the notification should not show', () => {
    render(<ReviewRoleDisplay review={testAccessRequestReviewNoResponses} />)
    expect(screen.queryByText(testMessage)).toBeNull()
  })
  it('shows a notification when a release or access request is created', async () => {
    vi.mocked(useGetModelRoles).mockReturnValue({
      modelRoles: [testManagerRole],
      isModelRolesLoading: false,
      isModelRolesError: undefined,
      mutateModelRoles: vi.fn(),
    })
    mockRoleUtils.getRoleDisplay.mockReturnValue('Manager')
    render(<ReviewRoleDisplay review={testAccessRequestReviewNoResponses} />)
    await waitFor(async () => {
      expect(await screen.findByText(testMessage)).toBeDefined()
    })
  })

  //message should dissappear when release/access request is approved
})
