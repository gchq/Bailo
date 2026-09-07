import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useGetUserInformation } from 'actions/user'
import { testUserInformation } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

import UserDisplay from '../../src/common/UserDisplay'

vi.mock('../../actions/user', () => ({
  useGetUserInformation: vi.fn(),
}))

describe('UserDisplay', () => {
  it('When given additional dynamic properties the user display component should render all three properties', async () => {
    vi.mocked(useGetUserInformation).mockReturnValue({
      userInformation: testUserInformation,
      isUserInformationLoading: false,
      isUserInformationError: undefined,
      mutateUserInformation: vi.fn(),
    })
    render(<UserDisplay dn='Joe Bloggs' />)

    const userDisplayName = await screen.findByTestId('userDisplayName')
    fireEvent.mouseEnter(userDisplayName)

    await waitFor(async () => {
      expect(await screen.findAllByTestId('userDisplayNameProperty')).toBeDefined()
      expect(await screen.findAllByTestId('userDisplayEmailProperty')).toBeDefined()
      expect(await screen.findAllByTestId('userDisplayDynamicProperty-birthday')).toBeDefined()
    })
  })
})
