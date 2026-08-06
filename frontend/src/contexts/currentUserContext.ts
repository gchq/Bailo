import { createContext } from 'react'
import { UserV3 } from 'types/types'

const CurrentUserContext = createContext<UserV3>({} as UserV3)

export default CurrentUserContext
