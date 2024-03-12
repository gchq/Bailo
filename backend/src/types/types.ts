export interface User {
  dn: string
}

export interface Role {
  id: string
  name: string
  short?: string
}

export interface UiConfig {
  banner: {
    enabled: boolean
    text: string
    colour: string
  }

  issues: {
    label: string
    supportHref: string
    contactHref: string
  }

  registry: {
    host: string
  }
}
