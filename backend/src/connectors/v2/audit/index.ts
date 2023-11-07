import config from '../../../utils/v2/config.js'
import { BaseAuditConnector } from './Base.js'
import { SillyAuditConnector } from './silly.js'

let auditConnector: undefined | BaseAuditConnector = undefined
export function getAutheticationConnector(cache = true) {
  if (auditConnector && cache) {
    return auditConnector
  }

  switch (config.connectors.audit.kind) {
    case 'silly':
      auditConnector = new SillyAuditConnector()
      break
    default:
      throw new Error('No valid audit connector provided.')
  }

  return auditConnector
}

export default getAutheticationConnector()
