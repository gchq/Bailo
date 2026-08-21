import { act, renderHook } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import useUnsavedChanges from '../../src/hooks/useUnsavedChanges'

async function triggerBlockedNavigation(url: string) {
  await expect(
    act(async () => {
      await mockRouter.replace(url)
    }),
  ).rejects.toThrow('routeChange aborted.')
  await act(async () => {})
}

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/model/test-id?tab=overview&page=0')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('no warning', () => {
    test('unsavedChanges is false', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      await act(async () => {
        await mockRouter.replace('/different-page')
      })

      expect(result.current.dialogOpen).toBe(false)
    })

    test('only the page query param changes', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=overview&page=1')
      })

      expect(result.current.dialogOpen).toBe(false)
    })

    test('page param is added to a URL that had none', async () => {
      mockRouter.setCurrentUrl('/model/test-id?tab=overview')
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=overview&page=1')
      })

      expect(result.current.dialogOpen).toBe(false)
    })
  })

  describe('warning', () => {
    test('navigating to a different page opens dialog', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await triggerBlockedNavigation('/different-page')

      expect(result.current.dialogOpen).toBe(true)
    })

    test('the tab query param changes opens dialog', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await triggerBlockedNavigation('/model/test-id?tab=settings')

      expect(result.current.dialogOpen).toBe(true)
    })

    test('both tab and page query params change opens dialog', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await triggerBlockedNavigation('/model/test-id?tab=settings&page=0')

      expect(result.current.dialogOpen).toBe(true)
    })
  })

  test('confirming dialog resets unsavedChanges', async () => {
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    await triggerBlockedNavigation('/different-page')

    act(() => {
      result.current.onDialogConfirm()
    })

    expect(result.current.unsavedChanges).toBe(false)
    expect(result.current.dialogOpen).toBe(false)
  })

  test('cancelling dialog keeps unsavedChanges and closes dialog', async () => {
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    await triggerBlockedNavigation('/different-page')

    act(() => {
      result.current.onDialogCancel()
    })

    expect(result.current.unsavedChanges).toBe(true)
    expect(result.current.dialogOpen).toBe(false)
  })

  test('sendWarning opens dialog and executes callback on confirm', () => {
    const { result } = renderHook(() => useUnsavedChanges())
    const callback = vi.fn()

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    act(() => {
      result.current.sendWarning(callback)
    })

    expect(result.current.dialogOpen).toBe(true)
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      result.current.onDialogConfirm()
    })

    expect(callback).toHaveBeenCalled()
    expect(result.current.unsavedChanges).toBe(false)
    expect(result.current.dialogOpen).toBe(false)
  })

  test('sendWarning does not execute callback on cancel', () => {
    const { result } = renderHook(() => useUnsavedChanges())
    const callback = vi.fn()

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    act(() => {
      result.current.sendWarning(callback)
    })

    expect(result.current.dialogOpen).toBe(true)

    act(() => {
      result.current.onDialogCancel()
    })

    expect(callback).not.toHaveBeenCalled()
    expect(result.current.unsavedChanges).toBe(true)
    expect(result.current.dialogOpen).toBe(false)
  })
})
