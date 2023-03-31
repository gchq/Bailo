import { ModelDoc, VersionDoc } from '../types/types.js'
import logger from './logger.js'

export default class AuthorisationBase {
  async onModelVersionUpload(version: VersionDoc) {
    const model: ModelDoc = version.model as ModelDoc
    logger.info(`Version "${version.version}" of model "${model.uuid}" has been uploaded`)
  }

  async onModelVersionUpdate(version: VersionDoc) {
    const model: ModelDoc = version.model as ModelDoc
    logger.info(`Version "${version.version}" of model "${model.uuid}" has been edited`)
  }
}
