import { render } from '@testing-library/react'
import { useGetCurrentUser, useListEntities } from 'actions/user'
import EntitySelector from 'src/MuiForms/EntitySelector'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../actions/user', () => ({
  useListEntities: vi.fn(),
  useGetCurrentUser: vi.fn(),
  useGetUserInformation: vi.fn(() => ({
    userInformation: {
      email: 'user@example.com',
      name: 'Joe Bloggs',
    },
  })),
}))

function setupUserMocks() {
  vi.mocked(useListEntities).mockReturnValue({
    users: [],
    isUsersLoading: false,
    isUsersError: undefined,
    mutateUsers: vi.fn(),
  })

  vi.mocked(useGetCurrentUser).mockReturnValue({
    currentUser: {
      dn: 'user:user',
      isAdmin: false,
    },
    isCurrentUserLoading: false,
    isCurrentUserError: undefined,
    mutateCurrentUser: vi.fn(),
  })
}

const baseRegistry = {
  formContext: {
    editMode: true,
  },
} as any

const arraySchema = {
  type: 'array',
  items: {
    type: 'string',
  },
  minItems: 1,
  maxItems: 1,
  hideDefaultUser: true,
} as any

describe('EntitySelector normalisation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupUserMocks()
  })

  it('renders without throwing when the array contains a null entry', () => {
    const onChange = vi.fn()

    expect(() =>
      render(
        <EntitySelector
          id='root_overview_riskOwner'
          schema={arraySchema}
          registry={baseRegistry}
          value={[null] as unknown as string[]}
          onChange={onChange}
        />,
      ),
    ).not.toThrow()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders without throwing when the array contains an undefined entry', () => {
    const onChange = vi.fn()

    expect(() =>
      render(
        <EntitySelector
          id='root_overview_riskOwner'
          schema={arraySchema}
          registry={baseRegistry}
          value={[undefined] as unknown as string[]}
          onChange={onChange}
        />,
      ),
    ).not.toThrow()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders without throwing when the array contains an empty string', () => {
    const onChange = vi.fn()

    expect(() =>
      render(
        <EntitySelector
          id='root_overview_riskOwner'
          schema={arraySchema}
          registry={baseRegistry}
          value={['']}
          onChange={onChange}
        />,
      ),
    ).not.toThrow()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores null entries while retaining valid entries', () => {
    const onChange = vi.fn()

    expect(() =>
      render(
        <EntitySelector
          id='root_overview_riskOwner'
          schema={arraySchema}
          registry={baseRegistry}
          value={[null, 'user:user'] as unknown as string[]}
          onChange={onChange}
        />,
      ),
    ).not.toThrow()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores undefined entries while retaining valid entries', () => {
    const onChange = vi.fn()

    expect(() =>
      render(
        <EntitySelector
          id='root_overview_riskOwner'
          schema={arraySchema}
          registry={baseRegistry}
          value={[undefined, 'user:user'] as unknown as string[]}
          onChange={onChange}
        />,
      ),
    ).not.toThrow()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores empty entries while retaining valid entries', () => {
    const onChange = vi.fn()

    expect(() =>
      render(
        <EntitySelector
          id='root_overview_riskOwner'
          schema={arraySchema}
          registry={baseRegistry}
          value={['', 'user:user']}
          onChange={onChange}
        />,
      ),
    ).not.toThrow()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not emit onChange when mounted with a valid array value', () => {
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_overview_riskOwner'
        schema={arraySchema}
        registry={baseRegistry}
        value={['user:user']}
        onChange={onChange}
      />,
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not emit onChange when mounted with an empty array', () => {
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_overview_riskOwner'
        schema={arraySchema}
        registry={baseRegistry}
        value={[]}
        onChange={onChange}
      />,
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not emit onChange more than once during mounting', () => {
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_overview_riskOwner'
        schema={arraySchema}
        registry={baseRegistry}
        value={[null, 'user:user'] as unknown as string[]}
        onChange={onChange}
      />,
    )

    expect(onChange).not.toHaveBeenCalled()
  })
})
