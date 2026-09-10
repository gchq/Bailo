import { render } from '@testing-library/react'
import { useGetCurrentUser, useListEntities } from 'actions/user'
import EntitySelector from 'src/MuiForms/EntitySelector'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../actions/user', () => ({
  useListEntities: vi.fn(),
  useGetCurrentUser: vi.fn(),
}))

function setupUserMocks() {
  vi.mocked(useListEntities).mockReturnValue({
    users: [],
    isUsersLoading: false,
    isUsersError: undefined,
    mutateUsers: vi.fn(),
  })
  vi.mocked(useGetCurrentUser).mockReturnValue({
    currentUser: { dn: 'user:test', isAdmin: false },
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
  items: { type: 'string' },
  minItems: 1,
  maxItems: 1,
  hideDefaultUser: true,
} as any

const stringSchema = {
  type: 'string',
  hideDefaultUser: true,
} as any

describe('EntitySelector normalisation', () => {
  it('emits [] once when mounted with [null] for an array schema', () => {
    setupUserMocks()
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_overview_riskOwner'
        schema={arraySchema}
        registry={baseRegistry}
        value={[null]}
        onChange={onChange}
      />,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("emits '' once when mounted with null for a string schema", () => {
    setupUserMocks()
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_owner'
        schema={stringSchema}
        registry={baseRegistry}
        value={null as unknown as string}
        onChange={onChange}
      />,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('does not emit onChange when mounted with a valid array value', () => {
    setupUserMocks()
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_overview_riskOwner'
        schema={arraySchema}
        registry={baseRegistry}
        value={['user:tony']}
        onChange={onChange}
      />,
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not emit onChange when mounted with an already-empty array', () => {
    setupUserMocks()
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

  it('strips null entries but keeps valid entries when mounted with a mixed array', () => {
    setupUserMocks()
    const onChange = vi.fn()

    render(
      <EntitySelector
        id='root_overview_riskOwner'
        schema={arraySchema}
        registry={baseRegistry}
        value={[null, 'user:tony']}
        onChange={onChange}
      />,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['user:tony'])
  })
})
