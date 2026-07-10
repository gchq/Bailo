import router from 'next/router'
import { useEffect, useState } from 'react'

export type UnsavedChangesHook = {
  unsavedChanges: boolean
  setUnsavedChanges: (newValue: boolean) => void
  sendWarning: () => boolean
}

/**
 * Returns a deterministically ordered array of query parameter entries.
 *
 * Parameters are sorted first by key and then by value, producing a stable
 * representation that can be safely compared regardless of the original
 * query string ordering.
 *
 * @param params The URL search parameters to normalise.
 * @returns An array of `[key, value]` tuples sorted by key and value.
 */
function normaliseParams(params: URLSearchParams): [string, string][] {
  return [...params.entries()].sort(([keyA, valueA], [keyB, valueB]) =>
    keyA === keyB ? valueA.localeCompare(valueB) : keyA.localeCompare(keyB),
  )
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
    const handleBrowseAway = (url: string) => {
      if (!unsavedChanges) {
        return
      }
      // Suppress edge case for switching page in JsonSchemaForm
      const currentUrl = new URL(router.asPath, window.location.origin)
      const destinationUrl = new URL(url, window.location.origin)
      if (currentUrl.pathname === destinationUrl.pathname) {
        const currentParams = new URLSearchParams(currentUrl.search)
        const destinationParams = new URLSearchParams(destinationUrl.search)
        currentParams.delete('page')
        destinationParams.delete('page')
        // stable comparison
        if (JSON.stringify(normaliseParams(currentParams)) === JSON.stringify(normaliseParams(destinationParams))) {
          return
        }
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
