import { User } from 'types/types'

export const entitiesIncludesCurrentUser = (entities: string[], currentUser: User | undefined) => {
  return entities.some((entity) => entity.split(':')[1] === currentUser?.dn)
}

export function toEntity(kind: string, value: string) {
  return `${kind}:${value}`
}

export function fromEntity(entity: string) {
  const [kind, ...values] = entity.split(':')
  return {
    kind,
    value: values.join(':'),
  }
}
