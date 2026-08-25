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

    test('only requiredByModelState query param changes', async () => {
      mockRouter.setCurrentUrl('/model/test-id?tab=overview&requiredByModelState=draft')
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=overview&requiredByModelState=submitted')
      })

      expect(result.current.dialogOpen).toBe(false)
    })

    test('only isEdit query param changes', async () => {
      mockRouter.setCurrentUrl('/model/test-id?tab=overview')
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=overview&isEdit=true')
      })

      expect(result.current.dialogOpen).toBe(false)
    })

    test('multiple ignored params change simultaneously', async () => {
      mockRouter.setCurrentUrl('/model/test-id?tab=overview&page=0')
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=overview&page=5&isEdit=true&requiredByModelState=draft')
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

  test('re-blocks navigation after cancel', async () => {
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    await triggerBlockedNavigation('/page-a')

    act(() => {
      result.current.onDialogCancel()
    })

    expect(result.current.dialogOpen).toBe(false)

    await triggerBlockedNavigation('/page-b')

    expect(result.current.dialogOpen).toBe(true)
  })

  describe('sendWarning', () => {
    test('opens dialog and executes callback on confirm', () => {
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

    test('does not execute callback on cancel', () => {
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

  describe('beforeunload', () => {
    test('calls preventDefault when unsavedChanges is true', () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    test('does not call preventDefault when unsavedChanges is false', () => {
      renderHook(() => useUnsavedChanges())

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    test('removes listener on unmount', () => {
      const { result, unmount } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      unmount()

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('submitting a form', () => {
    test('clearing unsavedChanges in the same tick as navigating does not warn', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      // Mirrors a submit handler: clear the flag, then redirect, without an intervening render
      await act(async () => {
        result.current.setUnsavedChanges(false)
        await mockRouter.push('/model/test-id/release/1.0.0')
      })

      expect(result.current.dialogOpen).toBe(false)
      expect(mockRouter.asPath).toBe('/model/test-id/release/1.0.0')
    })
  })

  describe('confirmed navigation proceeds', () => {
    test('confirmed route change does not re-block', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await triggerBlockedNavigation('/different-page')

      expect(result.current.dialogOpen).toBe(true)

      await act(async () => {
        result.current.onDialogConfirm()
      })

      expect(result.current.dialogOpen).toBe(false)
      expect(result.current.unsavedChanges).toBe(false)
    })
  })
})
