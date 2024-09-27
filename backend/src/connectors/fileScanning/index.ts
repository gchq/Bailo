import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'

export const FileScanKind = {
  ClamAv: 'clamAV',
} as const
export type FileScanKindKeys = (typeof FileScanKind)[keyof typeof FileScanKind]

let fileScanningConnector: undefined | BaseFileScanningConnector = undefined

const fileScanConnectors: BaseFileScanningConnector[] = []
export function getFileScanningConnectors(_cache = true) {
  config.connectors.fileScanners.kinds.forEach((fileScanner) => {
    switch (fileScanner) {
      case FileScanKind.ClamAv:
        fileScanningConnector = new ClamAvFileScanningConnector()
        fileScanConnectors.push(fileScanningConnector)
        fileScanningConnector.init()
        break
      default:
        throw ConfigurationError(`'${fileScanner}' is not a valid file scanning kind.`, {
          validKinds: Object.values(FileScanKind),
        })
    }
  })
  return fileScanConnectors
}

export default getFileScanningConnectors()
