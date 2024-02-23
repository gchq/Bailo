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

  uploadWarning: {
    showWarning: boolean
    checkboxText: string
  }

  deploymentWarning: {
    showWarning: boolean
    checkboxText: string
  }

  development: {
    logUrl: string
  }

  maxModelSizeGB: number
}
