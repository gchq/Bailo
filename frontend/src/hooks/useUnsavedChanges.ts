import router from 'next/router'
import { useEffect, useState } from 'react'

export type UnsavedChangesHook = {
  unsavedChanges: boolean
  setUnsavedChanges: (newValue: boolean) => void
  sendWarning: () => boolean
}

export default function useUnsavedChanges(): UnsavedChangesHook {
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const warningText = 'Any unsaved changes will be lost - are you sure you wish to leave this page?'

  useEffect(() => {
    const handleWindowClose = (e) => {
      if (!unsavedChanges) {
        return
      }
      e.preventDefault()
      return (e.returnValue = warningText)
    }

    const getComparableUrl = (url: string) => {
      const [pathname, queryString = ''] = url.split('?')
      const params = new URLSearchParams(queryString)
      // Ignore the 'page' query param when determining if the URL has meaningfully changed
      params.delete('page')
      params.delete('requiredByModelState')
      params.sort()
      const remaining = params.toString()
      return remaining ? `${pathname}?${remaining}` : pathname
    }
    const handleBrowseAway = (newUrl: string) => {
      if (!unsavedChanges) {
        return
      }
      // Skip warning if the only difference between the URLs is the 'page' query param
      if (getComparableUrl(router.asPath) === getComparableUrl(newUrl)) {
        return
      }
      const res = window.confirm(warningText)
      if (res) {
        setUnsavedChanges(false)
        return
      }
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

  const sendWarning = () => {
    const res = window.confirm(warningText)
    if (res) {
      setUnsavedChanges(false)
    }
    return res
  }

  return {
    unsavedChanges,
    setUnsavedChanges,
    sendWarning,
  }
}
