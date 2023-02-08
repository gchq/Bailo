import { DeploymentDoc } from '../models/Deployment.js'
import { ModelDoc } from '../models/Model.js'
import { VersionDoc } from '../models/Version.js'

const createRequestUrl = (model: ModelDoc, document: VersionDoc | DeploymentDoc, base: string): string => {
  if (model.uuid) {
    return `${base}/model/${model.uuid}`
  }
  if ('uuid' in document) {
    return `${base}/deployment/${document.uuid}`
  }
  return ''
}

export default createRequestUrl
