import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { patchFile } from 'actions/file'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import FileAccessSetting from 'src/entry/model/files/FileAccessSetting'
import { defaultUserPermissions } from 'src/hooks/UserPermissionsHook'
import { FileInterface } from 'types/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/file', () => ({ patchFile: vi.fn() }))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(patchFile).mockResolvedValue({ status: 200, data: {} })
})

function show(allowed: boolean, ungovernedAccess?: boolean) {
  const onChange = vi.fn()
  const file = { modelId: 'model', _id: 'file', ungovernedAccess } as FileInterface
  render(
    <UserPermissionsContext.Provider
      value={{
        userPermissions: {
          ...defaultUserPermissions,
          editEntry: allowed ? { hasPermission: true } : { hasPermission: false, info: 'Denied' },
        },
      }}
    >
      <FileAccessSetting file={file} onChange={onChange} />
    </UserPermissionsContext.Provider>,
  )
  return onChange
}

describe('file access setting', () => {
  it('requires confirmation before enabling downloads', async () => {
    const onChange = show(true)
    fireEvent.click(screen.getByRole('button', { name: 'Allow downloads without an access request' }))
    expect(patchFile).not.toHaveBeenCalled()
    expect(screen.getByText(/Other files will keep their existing access rules/)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(patchFile).toHaveBeenCalledWith('model', 'file', { ungovernedAccess: true }))
    await waitFor(() => expect(onChange).toHaveBeenCalledOnce())
  })

  it('cancels without changing access', () => {
    show(true, false)
    fireEvent.click(screen.getByRole('button', { name: 'Allow downloads without an access request' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(patchFile).not.toHaveBeenCalled()
  })

  it('restores normal access explicitly without overriding model-wide grants', async () => {
    show(true, true)
    fireEvent.click(screen.getByRole('button', { name: 'Require normal file access' }))
    expect(screen.getByText(/Model-wide ungoverned access and existing access grants will still apply/)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(patchFile).toHaveBeenCalledWith('model', 'file', { ungovernedAccess: false }))
  })

  it.each([true, false, undefined])('never shows edit controls without permission (%s)', (value) => {
    show(false, value)
    expect(screen.queryByRole('button')).toBeNull()
    expect(Boolean(screen.queryByText(/downloaded by anyone/))).toBe(value === true)
  })

  it('shows server errors without applying an optimistic permission change', async () => {
    vi.mocked(patchFile).mockResolvedValue({ status: 403, data: 'Owner permission required' })
    const onChange = show(true)
    fireEvent.click(screen.getByRole('button', { name: 'Allow downloads without an access request' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.getByText('Owner permission required')).toBeDefined())
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('handles a lost connection without claiming the update succeeded', async () => {
    vi.mocked(patchFile).mockRejectedValue(new Error('Disconnected'))
    const onChange = show(true)
    fireEvent.click(screen.getByRole('button', { name: 'Allow downloads without an access request' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.getByText('Unable to change file access. Please try again.')).toBeDefined())
    expect(onChange).not.toHaveBeenCalled()
  })
})
