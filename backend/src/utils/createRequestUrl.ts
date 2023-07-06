import { DeploymentDoc, ModelDoc, VersionDoc } from '../types/types.js'

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
