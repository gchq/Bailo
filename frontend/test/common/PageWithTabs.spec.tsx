import { fireEvent, render, screen } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import PageWithTabs, { PageTab } from '../../src/common/PageWithTabs'
import UnsavedChangesContext from '../../src/contexts/unsavedChangesContext'
import { UnsavedChangesHook } from '../../src/hooks/useUnsavedChanges'

const tabs: PageTab[] = [
  { title: 'Overview', path: 'overview', view: <div>Overview content</div> },
  { title: 'Settings', path: 'settings', view: <div>Settings content</div> },
]

function renderWithContext(contextValue: UnsavedChangesHook) {
  return render(
    <UnsavedChangesContext value={contextValue}>
      <PageWithTabs title='Test Page' tabs={tabs} />
    </UnsavedChangesContext>,
  )
}

function createMockContext(overrides: Partial<UnsavedChangesHook> = {}): UnsavedChangesHook {
  return {
    unsavedChanges: false,
    setUnsavedChanges: vi.fn(),
    sendWarning: vi.fn(),
    ...overrides,
  }
}

describe('PageWithTabs', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/model/test-id?tab=overview')
  })

  test('renders tabs', () => {
    renderWithContext(createMockContext())

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeDefined()
  })

  test('switching tabs without unsaved changes navigates directly', () => {
    const context = createMockContext()
    renderWithContext(context)

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }))

    expect(context.sendWarning).not.toHaveBeenCalled()
    expect(context.setUnsavedChanges).toHaveBeenCalledWith(false)
  })

  test('switching tabs with unsaved changes calls sendWarning', () => {
    const context = createMockContext({ unsavedChanges: true })
    renderWithContext(context)

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }))

    expect(context.sendWarning).toHaveBeenCalledWith(expect.any(Function))
    expect(context.setUnsavedChanges).not.toHaveBeenCalledWith(false)
  })

  test('sendWarning callback navigates to new tab when invoked', () => {
    const context = createMockContext({ unsavedChanges: true })
    renderWithContext(context)

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }))

    const callback = vi.mocked(context.sendWarning).mock.calls[0][0]
    callback()

    expect(context.setUnsavedChanges).toHaveBeenCalledWith(false)
    expect(mockRouter.query.tab).toBe('settings')
  })

  test('does not navigate until sendWarning callback fires', () => {
    const context = createMockContext({ unsavedChanges: true })
    renderWithContext(context)

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }))

    expect(mockRouter.query.tab).toBe('overview')
  })
})
