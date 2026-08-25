import router from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'

export type UnsavedChangesHook = {
  unsavedChanges: boolean
  setUnsavedChanges: (newValue: boolean) => void
  sendWarning: (onConfirm: () => void) => void
}

export type UseUnsavedChangesReturn = UnsavedChangesHook & {
  dialogOpen: boolean
  onDialogConfirm: () => void
  onDialogCancel: () => void
}

const warningText = 'Any unsaved changes will be lost - are you sure you wish to leave this page?'

/** Strips query params that do not represent a meaningful change of page. */
function getComparableUrl(url: string) {
  const [pathname, queryString = ''] = url.split('?')
  const params = new URLSearchParams(queryString)
  params.delete('page')
  params.delete('requiredByModelState')
  params.delete('isEdit')
  params.sort()
  const remaining = params.toString()
  return remaining ? `${pathname}?${remaining}` : pathname
}

export default function useUnsavedChanges(): UseUnsavedChangesReturn {
  const [unsavedChanges, setUnsavedChangesState] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)
  const skipWarningRef = useRef(false)
  // Mirrors unsavedChanges so navigation started in the same tick as setUnsavedChanges(false) - such as
  // submitting a form and redirecting - sees the new value rather than the not-yet-rendered state
  const unsavedChangesRef = useRef(false)

  const setUnsavedChanges = useCallback((newValue: boolean) => {
    unsavedChangesRef.current = newValue
    setUnsavedChangesState(newValue)
  }, [])

  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!unsavedChangesRef.current) {
        return
      }
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- required for cross-browser beforeunload support
      return (e.returnValue = warningText)
    }

    const shouldWarn = (newUrl: string) => {
      if (!unsavedChangesRef.current) {
        return false
      }
      if (skipWarningRef.current) {
        skipWarningRef.current = false
        return false
      }
      return getComparableUrl(router.asPath) !== getComparableUrl(newUrl)
    }

    const handleBrowseAway = (newUrl: string) => {
      if (!shouldWarn(newUrl)) {
        return
      }
      // routeChangeStart does not expose the original method (push vs replace),
      // so confirmed re-navigation always uses push
      pendingActionRef.current = () => {
        skipWarningRef.current = true
        setUnsavedChanges(false)
        router.push(newUrl)
      }
      setDialogOpen(true)
      router.events.emit('routeChangeError')
      throw 'routeChange aborted.'
    }

    // Browser back/forward buttons bypass routeChangeStart, so they are handled here
    const handlePopState = ({ as }: { as: string }) => {
      const previousUrl = router.asPath
      if (!shouldWarn(as)) {
        return true
      }
      // The address bar has already moved to the popped entry, so put it back
      window.history.pushState(null, '', previousUrl)
      pendingActionRef.current = () => {
        skipWarningRef.current = true
        setUnsavedChanges(false)
        router.push(as)
      }
      setDialogOpen(true)
      return false
    }

    window.addEventListener('beforeunload', handleWindowClose)
    router.events.on('routeChangeStart', handleBrowseAway)
    router.beforePopState(handlePopState)
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose)
      router.events.off('routeChangeStart', handleBrowseAway)
      router.beforePopState(() => true)
    }
  }, [setUnsavedChanges])

  const sendWarning = useCallback(
    (onConfirm: () => void) => {
      pendingActionRef.current = () => {
        skipWarningRef.current = true
        setUnsavedChanges(false)
        onConfirm()
      }
      setDialogOpen(true)
    },
    [setUnsavedChanges],
  )

  const onDialogConfirm = useCallback(() => {
    pendingActionRef.current?.()
    pendingActionRef.current = null
    setDialogOpen(false)
  }, [])

  const onDialogCancel = useCallback(() => {
    // The navigation was rejected, so the skip flag must not leak into the next attempt
    skipWarningRef.current = false
    pendingActionRef.current = null
    setDialogOpen(false)
  }, [])

  return {
    unsavedChanges,
    setUnsavedChanges,
    sendWarning,
    dialogOpen,
    onDialogConfirm,
    onDialogCancel,
  }
}
