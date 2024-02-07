// import { describe, expect, vi } from 'vitest'
// import { render, screen, waitFor } from '@testing-library/react'
// import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
// import { testAccessRequestReviewNoResponses, testManagerRole } from 'utils/test/testModels'
// import { useGetModelRoles } from 'actions/model'

// const mockRoleUtils = vi.hoisted(() => {
//   return {
//     getRoleDisplay: vi.fn(),
//   }
// })
// vi.mock('utils/beta/roles.ts', () => mockRoleUtils)

// vi.mock('actions/model', () => ({
//   useGetModelRoles: vi.fn(),
// }))

// describe('ReviewRoleDisplay', () => {
//   // do test to make sure that message should/does not show
//   it('the notification should not show', () => {
//     render(<ReviewRoleDisplay review={testAccessRequestReviewNoResponses} />)
//   })
//   it('shows a notification when a release or access request is created', async () => {
//     vi.mocked(useGetModelRoles).mockReturnValue({
//       modelRoles: [testManagerRole],
//       isModelRolesLoading: false,
//       isModelRolesError: undefined,
//       mutateModelRoles: vi.fn(),
//     })
//     mockRoleUtils.getRoleDisplay.mockReturnValue('Manager')
//     render(<ReviewRoleDisplay review={testAccessRequestReviewNoResponses} />)
//     await waitFor(async () => {
//       expect(await screen.findByText('This access needs to be reviewed by the Manager.')).toBeDefined()
//     })
//   })

//   //message should dissappear when release/access request is approved
// })
