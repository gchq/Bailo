import { FileInterface, ScanState } from '../../models/File.js'
import { updateFileWithResults } from '../../services/file.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector, clamAvToolName } from './clamAv.js'

export const FileScanKind = {
  ClamAv: 'clamAV',
} as const
export type FileScanKindKeys = (typeof FileScanKind)[keyof typeof FileScanKind]

const fileScanConnectors: BaseFileScanningConnector[] = []
export function getFileScanningConnectors(file: FileInterface) {
  config.connectors.fileScanners.kinds.forEach(async (fileScanner) => {
    switch (fileScanner) {
      case FileScanKind.ClamAv:
        fileScanConnectors.push(new ClamAvFileScanningConnector())
        await updateFileWithResults(file, { toolName: clamAvToolName, state: ScanState.InProgress }, clamAvToolName)
        break
      default:
        throw ConfigurationError(`'${fileScanner}' is not a valid file scanning kind.`, {
          validKinds: Object.values(FileScanKind),
        })
    }
  })
  return fileScanConnectors
}
