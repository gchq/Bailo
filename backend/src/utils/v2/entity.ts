export const EntityKind = {
  User: 'user',
  Group: 'group',
} as const
export type EntityKindKeys = (typeof EntityKind)[keyof typeof EntityKind]

export function toEntity(kind: EntityKindKeys, value: string) {
  return `${kind}:${value}`
}

export function fromEntity(entity: string) {
  const [kind, ...values] = entity.split(':')
  return {
    kind,
    value: values.join(':'),
  }
}
