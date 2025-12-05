import { ModelCardRevisionDoc } from '../../models/ModelCardRevision.js'
import { ReleaseDoc } from '../../models/Release.js'
import { MirrorImportLogData } from '../../types/types.js'
import { InternalError } from '../../utils/error.js'
import { isModelCardRevisionDoc } from '../model.js'
import { isReleaseDoc } from '../release.js'

export function parseModelCard(
  modelCard: unknown,
  mirroredModelId: string,
  sourceModelId: string,
  logData: MirrorImportLogData,
): Omit<ModelCardRevisionDoc, '_id'> {
  if (!isModelCardRevisionDoc(modelCard)) {
    throw InternalError('Data cannot be converted into a model card.', {
      modelCard,
      mirroredModelId,
      sourceModelId,
      ...logData,
    })
  }
  const modelId = modelCard.modelId
  modelCard.modelId = mirroredModelId
  delete modelCard._id
  if (sourceModelId !== modelId) {
    throw InternalError(
      'Compressed file contains model cards that have a model ID that does not match the source model Id.',
      {
        modelId,
        sourceModelId,
        ...logData,
      },
    )
  }
  return modelCard
}

export function parseRelease(
  release: unknown,
  mirroredModelId: string,
  sourceModelId: string,
  logData: MirrorImportLogData,
): Omit<ReleaseDoc, '_id'> {
  if (!isReleaseDoc(release)) {
    throw InternalError('Data cannot be converted into a release.', {
      release,
      mirroredModelId,
      sourceModelId,
      ...logData,
    })
  }

  const modelId = release.modelId
  release.modelId = mirroredModelId
  delete release._id

  if (sourceModelId !== modelId) {
    throw InternalError(
      'Compressed file contains releases that have a model ID that does not match the source model Id.',
      {
        release,
        mirroredModelId,
        sourceModelId,
        ...logData,
      },
    )
  }

  return release
}
