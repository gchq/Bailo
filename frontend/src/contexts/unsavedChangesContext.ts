import { createContext } from 'react'

import { UnsavedChangesHook } from '../../utils/hooks/useUnsavedChanges'

const UnsavedChangesContext = createContext<UnsavedChangesHook>({
  unsavedChanges: false,
  setUnsavedChanges: () => null,
  sendWarning: () => null,
})

export default UnsavedChangesContext
