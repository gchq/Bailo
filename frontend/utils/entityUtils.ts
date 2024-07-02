import { User } from 'types/types'

export const entitiesIncludesCurrentUser = (entities: string[], currentUser: User | undefined) => {
  return entities.some((entity) => entity.split(':')[1] === currentUser?.dn)
}
