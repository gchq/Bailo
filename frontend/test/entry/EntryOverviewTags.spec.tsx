import { ThemeProvider } from '@mui/material/styles'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { patchEntry, postEntryTag } from 'actions/entry'
import UiConfigContext from 'src/contexts/uiConfigContext'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import EntryOverviewDetails from 'src/entry/EntryOverviewDetails'
import { defaultUserPermissions } from 'src/hooks/UserPermissionsHook'
import { lightTheme } from 'src/theme'
import { EntryInterface, EntryKind, UiConfig } from 'types/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/entry', () => ({ patchEntry: vi.fn(), postEntryTag: vi.fn() }))
vi.mock('actions/review', () => ({
  postReview: vi.fn(),
  useGetReviewRequestsForModel: () => ({
    reviews: [],
    isReviewsLoading: false,
    isReviewsError: undefined,
    mutateReviews: vi.fn(),
  }),
}))
vi.mock('src/hooks/useNotification', () => ({ default: () => vi.fn() }))
vi.mock('src/common/UserDisplay', () => ({ default: () => null }))
vi.mock('src/entry/overview/EntryRolesDialog', () => ({ default: () => null }))
vi.mock('src/entry/overview/ReviewHistoryDialog', () => ({ default: () => null }))

const entry = { id: 'entry', kind: EntryKind.MODEL, tags: ['existing'], collaborators: [] } as unknown as EntryInterface
const uiConfig = { modelDetails: { organisations: [], states: [] } } as unknown as UiConfig

function show(canEdit: boolean, canAdd: boolean) {
  const mutateEntry = vi.fn()
  const denied = { hasPermission: false as const, info: 'Denied' }
  const permissions = {
    ...defaultUserPermissions,
    editEntry: canEdit ? { hasPermission: true as const } : denied,
    addEntryTags: canAdd ? { hasPermission: true as const } : denied,
  }
  const result = render(
    <ThemeProvider theme={lightTheme}>
      <UiConfigContext.Provider value={uiConfig}>
        <UserPermissionsContext.Provider value={{ userPermissions: permissions }}>
          <EntryOverviewDetails entry={entry} mutateEntry={mutateEntry} />
        </UserPermissionsContext.Provider>
      </UiConfigContext.Provider>
    </ThemeProvider>,
  )
  return { ...result, mutateEntry }
}

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(patchEntry).mockResolvedValue(new Response('{}', { status: 200 }))
  vi.mocked(postEntryTag).mockResolvedValue(new Response('{}', { status: 200 }))
})

describe('entry tag permissions', () => {
  it('uses the add-only endpoint for consumers', async () => {
    const { mutateEntry } = show(false, true)
    fireEvent.click(screen.getByRole('button', { name: /Add model card tags/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    await waitFor(() => expect(postEntryTag).toHaveBeenCalledWith('entry', 'new'))
    expect(patchEntry).not.toHaveBeenCalled()
    await waitFor(() => expect(mutateEntry).toHaveBeenCalled())
    expect(document.querySelector('.MuiChip-deleteIcon')).toBeNull()
  })

  it('retains owner editing and removal', async () => {
    show(true, true)
    fireEvent.click(screen.getByRole('button', { name: /Edit model card tags/i }))
    const removeIcon = document.querySelector('.MuiChip-deleteIcon')
    expect(removeIcon).not.toBeNull()
    fireEvent.click(removeIcon!)
    await waitFor(() => expect(patchEntry).toHaveBeenCalledWith('entry', { tags: [] }))
    expect(postEntryTag).not.toHaveBeenCalled()
  })

  it('hides tag actions without either permission', () => {
    show(false, false)
    expect(screen.queryByRole('button', { name: /model card tags/i })).toBeNull()
  })

  it('shows server errors without updating the entry', async () => {
    vi.mocked(postEntryTag).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Tag not allowed' } }), { status: 403 }),
    )
    const { mutateEntry } = show(false, true)
    fireEvent.click(screen.getByRole('button', { name: /Add model card tags/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    await waitFor(() => expect(screen.getByText('Forbidden: Tag not allowed')).toBeDefined())
    expect(mutateEntry).not.toHaveBeenCalled()
  })
})
