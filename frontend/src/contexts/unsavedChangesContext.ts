import { createContext } from 'react'

import { UnsavedChangesHook } from '../../utils/hooks/useUnsavedChanges'

const UnsavedChangesContext = createContext<UnsavedChangesHook>({
  unsavedChanges: false,
  setUnsavedChanges: () => undefined,
  sendWarning: () => false,
})

export default UnsavedChangesContext
