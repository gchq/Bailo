import { createContext } from 'react'

import { UnsavedChangesHook } from '../hooks/useUnsavedChanges'

const UnsavedChangesContext = createContext<UnsavedChangesHook>({
  unsavedChanges: false,
  setUnsavedChanges: () => undefined,
  sendWarning: () => false,
})

export default UnsavedChangesContext
