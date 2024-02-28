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
