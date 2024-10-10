import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'
import { FileScanningWrapper } from './wrapper.js'

export const FileScanKind = {
  ClamAv: 'clamAV',
} as const
export type FileScanKindKeys = (typeof FileScanKind)[keyof typeof FileScanKind]

const fileScanConnectors: BaseFileScanningConnector[] = []
export default function runFileScanners() {
  config.connectors.fileScanners.kinds.forEach(async (fileScanner) => {
    switch (fileScanner) {
      case FileScanKind.ClamAv:
        fileScanConnectors.push(new ClamAvFileScanningConnector())
        break
      default:
        throw ConfigurationError(`'${fileScanner}' is not a valid file scanning kind.`, {
          validKinds: Object.values(FileScanKind),
        })
    }
  })

  const wrapper = new FileScanningWrapper(fileScanConnectors)
  return wrapper
}
