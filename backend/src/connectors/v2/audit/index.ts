import config from '../../../utils/v2/config.js'
import { ConfigurationError } from '../../../utils/v2/error.js'
import { BaseAuditConnector } from './Base.js'
import { SillyAuditConnector } from './silly.js'
import { StdoutAuditConnector } from './stdout.js'

export const AuditKind = {
  Silly: 'silly',
  Stdout: 'stdout',
} as const
export type AuditKindKeys = (typeof AuditKind)[keyof typeof AuditKind]

let auditConnector: undefined | BaseAuditConnector = undefined
export function getAuditConnector(cache = true) {
  if (auditConnector && cache) {
    return auditConnector
  }

  switch (config.connectors.audit.kind) {
    case AuditKind.Silly:
      auditConnector = new SillyAuditConnector()
      break
    case AuditKind.Stdout:
      auditConnector = new StdoutAuditConnector()
      break
    default:
      throw ConfigurationError(`'${config.connectors.audit.kind}' is not a valid audit kind.`, {
        validKinds: Object.values(AuditKind),
      })
  }

  return auditConnector
}

export default getAuditConnector()
