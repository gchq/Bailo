import { render, screen, waitFor } from '@testing-library/react'
import { useGetModelRoles } from 'actions/model'
import { useGetResponses } from 'actions/response'
import { useGetUiConfig } from 'actions/uiConfig'
import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
import {
  testAccessRequestReview,
  testAccessRequestReviewNoResponses,
  testManagerRole,
  testReleaseReview,
  testReleaseReviewNoResponses,
  testReviewResponse,
  testUiConfig,
} from 'utils/test/testModels'
import { describe, expect, vi } from 'vitest'

const mockRoleUtils = vi.hoisted(() => {
  return {
    getRoleDisplay: vi.fn(),
  }
})
vi.mock('utils/roles.ts', () => mockRoleUtils)

vi.mock('actions/model', () => ({
  useGetModelRoles: vi.fn(),
}))

vi.mock('actions/response', () => ({
  useGetResponses: vi.fn(),
}))

vi.mock('actions/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
}))

describe('ReviewRoleDisplay', () => {
  const testMessageAccess = 'This access needs to be reviewed by the Manager.'
  const testMessageRelease = 'This release needs to be reviewed by the Manager.'

  it('shows a message when an access request has no responses', async () => {
    vi.mocked(useGetModelRoles).mockReturnValue({
      modelRoles: [testManagerRole],
      isModelRolesLoading: false,
      isModelRolesError: undefined,
      mutateModelRoles: vi.fn(),
    })
    vi.mocked(useGetResponses).mockReturnValue({
      responses: [],
      isResponsesLoading: false,
      isResponsesError: undefined,
      mutateResponses: vi.fn(),
    })
    vi.mocked(useGetUiConfig).mockReturnValue({
      uiConfig: testUiConfig,
      isUiConfigLoading: false,
      isUiConfigError: undefined,
      mutateUiConfig: vi.fn(),
    })
    mockRoleUtils.getRoleDisplay.mockReturnValue('Manager')
    render(<ReviewRoleDisplay review={testAccessRequestReviewNoResponses} />)
    await waitFor(async () => {
      expect(await screen.findByText(testMessageAccess)).toBeDefined()
    })
  })

  it('shows a message when an release has no responses', async () => {
    vi.mocked(useGetModelRoles).mockReturnValue({
      modelRoles: [testManagerRole],
      isModelRolesLoading: false,
      isModelRolesError: undefined,
      mutateModelRoles: vi.fn(),
    })
    vi.mocked(useGetResponses).mockReturnValue({
      responses: [],
      isResponsesLoading: false,
      isResponsesError: undefined,
      mutateResponses: vi.fn(),
    })
    vi.mocked(useGetUiConfig).mockReturnValue({
      uiConfig: testUiConfig,
      isUiConfigLoading: false,
      isUiConfigError: undefined,
      mutateUiConfig: vi.fn(),
    })
    mockRoleUtils.getRoleDisplay.mockReturnValue('Manager')
    render(<ReviewRoleDisplay review={testReleaseReviewNoResponses} />)
    await waitFor(async () => {
      expect(await screen.findByText(testMessageRelease)).toBeDefined()
    })
  })

  it('does not show a message when an access request has responses', async () => {
    vi.mocked(useGetModelRoles).mockReturnValue({
      modelRoles: [testManagerRole],
      isModelRolesLoading: false,
      isModelRolesError: undefined,
      mutateModelRoles: vi.fn(),
    })
    vi.mocked(useGetResponses).mockReturnValue({
      responses: [testReviewResponse],
      isResponsesLoading: false,
      isResponsesError: undefined,
      mutateResponses: vi.fn(),
    })
    vi.mocked(useGetUiConfig).mockReturnValue({
      uiConfig: testUiConfig,
      isUiConfigLoading: false,
      isUiConfigError: undefined,
      mutateUiConfig: vi.fn(),
    })
    mockRoleUtils.getRoleDisplay.mockReturnValue('Manager')
    render(<ReviewRoleDisplay review={testAccessRequestReview} />)

    await waitFor(async () => {
      expect(screen.queryByText(testMessageAccess)).toBeNull()
    })
  })

  it('does not show a message when an release has responses', async () => {
    vi.mocked(useGetModelRoles).mockReturnValue({
      modelRoles: [testManagerRole],
      isModelRolesLoading: false,
      isModelRolesError: undefined,
      mutateModelRoles: vi.fn(),
    })
    vi.mocked(useGetResponses).mockReturnValue({
      responses: [testReviewResponse],
      isResponsesLoading: false,
      isResponsesError: undefined,
      mutateResponses: vi.fn(),
    })
    vi.mocked(useGetUiConfig).mockReturnValue({
      uiConfig: testUiConfig,
      isUiConfigLoading: false,
      isUiConfigError: undefined,
      mutateUiConfig: vi.fn(),
    })
    mockRoleUtils.getRoleDisplay.mockReturnValue('Manager')
    render(<ReviewRoleDisplay review={testReleaseReview} />)

    await waitFor(async () => {
      expect(screen.queryByText(testMessageRelease)).toBeNull()
    })
  })
})
