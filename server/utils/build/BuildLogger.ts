import Logger from 'bunyan'
import { VersionWithModel } from '../../../types/models/version'

export class BuildLogger {
  version: VersionWithModel

  logger: Logger

  constructor(version: VersionWithModel, logger: Logger) {
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
