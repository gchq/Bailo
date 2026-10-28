import { createContext } from 'react'
import { type UiConfig } from 'types/types'

const UiConfigContext = createContext<UiConfig>({} as UiConfig)

export default UiConfigContext
