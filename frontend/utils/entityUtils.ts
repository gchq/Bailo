import { EntityKind, User } from 'types/types'

/** Matches both the entity form (`user:joe`) and a bare distinguished name (`joe`). */
export const isCurrentUserEntity = (entity: string, currentUser: User | undefined) => {
  if (!currentUser) {
    return false
  }

  const { kind, id } = fromEntity(entity)
  return entity === currentUser.dn || (kind === EntityKind.USER && id === currentUser.dn)
}

export const entitiesIncludesCurrentUser = (entities: string[], currentUser: User | undefined) => {
  return entities.some((entity) => isCurrentUserEntity(entity, currentUser))
}

export function toEntity(kind: string, value: string) {
  return `${kind}:${value}`
}

export function fromEntity(entity: string) {
  const [kind, ...values] = entity.split(':')
  return {
    kind,
    id: values.join(':'),
  }
}
