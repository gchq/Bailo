import { act, renderHook } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import useUnsavedChanges from '../../src/hooks/useUnsavedChanges'

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/model/test-id?tab=overview&page=0')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('no warning', () => {
    test('unsavedChanges is false', async () => {
      renderHook(() => useUnsavedChanges())

      await act(async () => {
        await mockRouter.replace('/different-page')
      })

      expect(window.confirm).not.toHaveBeenCalled()
    })

    test('only the page query param changes', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=overview&page=1')
      })

      expect(window.confirm).not.toHaveBeenCalled()
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

      expect(window.confirm).not.toHaveBeenCalled()
    })
  })

  describe('warning', () => {
    test('navigating to a different page', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/different-page')
      })

      expect(window.confirm).toHaveBeenCalled()
    })

    test('the tab query param changes', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=settings')
      })

      expect(window.confirm).toHaveBeenCalled()
    })

    test('both tab and page query params change', async () => {
      const { result } = renderHook(() => useUnsavedChanges())

      act(() => {
        result.current.setUnsavedChanges(true)
      })

      await act(async () => {
        await mockRouter.replace('/model/test-id?tab=settings&page=0')
      })

      expect(window.confirm).toHaveBeenCalled()
    })
  })

  test('set unsavedChanges to false when user confirms the warning', async () => {
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    await act(async () => {
      await mockRouter.replace('/different-page')
    })

    expect(result.current.unsavedChanges).toBe(false)
  })

  test('abort navigation when user cancels the warning', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    await expect(
      act(async () => {
        await mockRouter.replace('/different-page')
      }),
    ).rejects.toThrow('routeChange aborted.')

    expect(result.current.unsavedChanges).toBe(true)
  })

  test('sendWarning returns true and resets state when user confirms', () => {
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    let returnValue: boolean
    act(() => {
      returnValue = result.current.sendWarning()
    })

    expect(returnValue!).toBe(true)
    expect(result.current.unsavedChanges).toBe(false)
  })

  test('sendWarning returns false and keeps state when user cancels', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { result } = renderHook(() => useUnsavedChanges())

    act(() => {
      result.current.setUnsavedChanges(true)
    })

    let returnValue: boolean
    act(() => {
      returnValue = result.current.sendWarning()
    })

    expect(returnValue!).toBe(false)
    expect(result.current.unsavedChanges).toBe(true)
  })
})
