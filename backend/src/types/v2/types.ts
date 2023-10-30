export interface User {
  dn: string
}

export interface Role {
  id: string
  name: string
  short?: string
}

export interface FlattenedModelImage {
  namespace: string
  model: string
  version: string
}
