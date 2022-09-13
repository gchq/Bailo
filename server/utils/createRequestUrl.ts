import { DeploymentDoc } from '../models/Deployment'
import { ModelDoc } from '../models/Model'
import { VersionDoc } from '../models/Version'

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
