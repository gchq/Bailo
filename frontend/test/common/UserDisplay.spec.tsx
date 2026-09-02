import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useGetCurrentUser, useGetUserInformation } from 'actions/user'
import { testUserInformation } from 'utils/test/testModels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UserDisplay from '../../src/common/UserDisplay'

vi.mock('../../actions/user', () => ({
  useGetUserInformation: vi.fn(),
  useGetCurrentUser: vi.fn(),
}))

function mockCurrentUser(dn?: string) {
  vi.mocked(useGetCurrentUser).mockReturnValue({
    currentUser: dn ? { dn, isAdmin: false } : undefined,
    isCurrentUserLoading: false,
    isCurrentUserError: undefined,
    mutateCurrentUser: vi.fn(),
  })
}

describe('UserDisplay', () => {
  beforeEach(() => {
    vi.mocked(useGetUserInformation).mockReturnValue({
      userInformation: testUserInformation,
      isUserInformationLoading: false,
      isUserInformationError: undefined,
      mutateUserInformation: vi.fn(),
    })
    mockCurrentUser()
  })

  it('When given additional dynamic properties the user display component should render all three properties', async () => {
    render(<UserDisplay dn='Joe Bloggs' />)

    const userDisplayName = await screen.findByTestId('userDisplayName')
    fireEvent.mouseEnter(userDisplayName)

    await waitFor(async () => {
      expect(await screen.findAllByTestId('userDisplayNameProperty')).toBeDefined()
      expect(await screen.findAllByTestId('userDisplayEmailProperty')).toBeDefined()
      expect(await screen.findAllByTestId('userDisplayDynamicProperty-birthday')).toBeDefined()
    })
  })

  it.each([
    ['entity form', 'user:joe'],
    ['bare dn', 'joe'],
  ])('marks the name as the current user when the dn is in %s', async (_form, dn) => {
    mockCurrentUser('joe')
    render(<UserDisplay dn={dn} highlightCurrentUser />)

    await waitFor(async () => {
      expect(await screen.findByText('Joe Bloggs (you)')).toBeDefined()
    })
  })

  it('does not mark the name when highlighting is not requested', async () => {
    mockCurrentUser('joe')
    render(<UserDisplay dn='user:joe' />)

    await waitFor(async () => {
      expect(await screen.findByText('Joe Bloggs')).toBeDefined()
      expect(screen.queryByText('Joe Bloggs (you)')).toBeNull()
    })
  })

  it('does not mark the name when the dn belongs to somebody else', async () => {
    mockCurrentUser('someone-else')
    render(<UserDisplay dn='user:joe' highlightCurrentUser />)

    await waitFor(async () => {
      expect(await screen.findByText('Joe Bloggs')).toBeDefined()
      expect(screen.queryByText('Joe Bloggs (you)')).toBeNull()
    })
  })

  it('marks the avatar as the current user', async () => {
    mockCurrentUser('joe')
    render(<UserDisplay dn='user:joe' displayAsAvatar highlightCurrentUser />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('joe (you)')).toBeDefined()
    })
  })
})
