export interface User {
  dn: string
}

export interface Role {
  id: string
  name: string
  short?: string
}

export interface FlattenedModelImage {
  repository: string
  name: string
  tag: string
}
