import Logger from 'bunyan'
import { VersionDoc } from '../../models/Version'

export class BuildLogger {
  version: VersionDoc

  logger: Logger

  constructor(version: VersionDoc, logger: Logger) {
    this.version = version
    this.logger = logger
  }

  info(data: any, message: string) {
    this.logger.info(data, message)
    message.split(/\r?\n/).forEach((msg) => this.version.log('info', msg))
  }

  error(data: any, message: string) {
    this.logger.error(data, message)
    message.split(/\r?\n/).forEach((msg) => this.version.log('error', msg))
  }
}
