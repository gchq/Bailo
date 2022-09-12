import { createContext } from 'react'
import { DocsMenuHook } from '@/utils/useDocsMenu'

const DocsMenuContext = createContext<DocsMenuHook>({
  docsMenuContent: [],
  errorMessage: '',
})

export default DocsMenuContext
