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

export default function useUnsavedChanges(): UseUnsavedChangesReturn {
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)
  const skipWarningRef = useRef(false)

  const warningText = 'Any unsaved changes will be lost - are you sure you wish to leave this page?'

  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!unsavedChanges) {
        return
      }
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- required for cross-browser beforeunload support
      return (e.returnValue = warningText)
    }

    const getComparableUrl = (url: string) => {
      const [pathname, queryString = ''] = url.split('?')
      const params = new URLSearchParams(queryString)
      params.delete('page')
      params.delete('requiredByModelState')
      params.delete('isEdit')
      params.sort()
      const remaining = params.toString()
      return remaining ? `${pathname}?${remaining}` : pathname
    }

    const handleBrowseAway = (newUrl: string) => {
      if (!unsavedChanges) {
        return
      }
      if (skipWarningRef.current) {
        skipWarningRef.current = false
        return
      }
      if (getComparableUrl(router.asPath) === getComparableUrl(newUrl)) {
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

    window.addEventListener('beforeunload', handleWindowClose)
    router.events.on('routeChangeStart', handleBrowseAway)
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose)
      router.events.off('routeChangeStart', handleBrowseAway)
    }
  }, [unsavedChanges])

  const sendWarning = useCallback((onConfirm: () => void) => {
    pendingActionRef.current = () => {
      skipWarningRef.current = true
      setUnsavedChanges(false)
      onConfirm()
    }
    setDialogOpen(true)
  }, [])

  const onDialogConfirm = useCallback(() => {
    pendingActionRef.current?.()
    pendingActionRef.current = null
    setDialogOpen(false)
  }, [])

  const onDialogCancel = useCallback(() => {
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
