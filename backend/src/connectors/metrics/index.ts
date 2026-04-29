import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseMetricsConnector } from './base.js'
import { SimpleMetricsConnector } from './simple.js'

export const MetricsKind = {
  Simple: 'simple',
} as const
export type MetricsKindKeys = (typeof MetricsKind)[keyof typeof MetricsKind]

let metricsConnector: undefined | BaseMetricsConnector = undefined
export function getMetricsConnector(cache = true) {
  if (metricsConnector && cache) {
    return metricsConnector
  }

  switch (config.connectors.metrics.kind) {
    case MetricsKind.Simple:
      metricsConnector = new SimpleMetricsConnector()
      break
    default:
      throw ConfigurationError(`'${config.connectors.metrics.kind}' is not a valid metrics kind.`, {
        validKinds: Object.values(MetricsKind),
      })
  }

  return metricsConnector
}

export default getMetricsConnector()
