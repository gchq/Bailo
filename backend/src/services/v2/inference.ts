import { ModelAction } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import InferenceModel, { InferenceDoc, InferenceInterface } from '../../models/v2/Inference.js'
import Inference from '../../models/v2/Inference.js'
import { UserDoc } from '../../models/v2/User.js'
import { BadReq, Forbidden, NotFound } from '../../utils/v2/error.js'
import { isMongoServerError } from '../../utils/v2/mongo.js'
import { getModelById } from './model.js'
import { listModelImages } from './registry.js'

export async function getInferenceByImage(user: UserDoc, modelId: string, image: string, tag: string) {
  const model = await getModelById(user, modelId)
  const inference = await Inference.findOne({
    modelId,
    image,
    tag,
  })

  if (!inference) {
    throw NotFound(`The requested inferencing service was not found.`, { modelId, image, tag })
  }

  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }
  return inference
}

export async function getInferencesByModel(user: UserDoc, modelId: string) {
  const model = await getModelById(user, modelId)

  if (!model) {
    throw NotFound(`The requested model was not found.`, { modelId })
  }

  const inferences = await InferenceModel.find({ modelId })

  return inferences
}

export type CreateInferenceParams = Pick<InferenceInterface, 'image' | 'tag' | 'description' | 'settings'>

export async function createInference(user: UserDoc, modelId: string, inferenceParams: CreateInferenceParams) {
  const model = await getModelById(user, modelId)

  // Check that an image exists in the registry
  const images = await listModelImages(user, modelId)

  const image = images.find((image) => image.repository === modelId && image.name === inferenceParams.image)

  if (image?.tags.indexOf(inferenceParams.tag) === -1) {
    throw NotFound(`Image ${modelId}:${inferenceParams.tag} was not found on this model.`, {
      modelId: modelId,
    })
  }
  const inference = new Inference({
    modelId: modelId,
    createdBy: user.dn,
    ...inferenceParams,
  })

  try {
    await inference.save()
  } catch (error) {
    if (isMongoServerError(error) && error.code === 11000) {
      throw BadReq(`A service with this image already exists.`, {
        modelId: modelId,
        image: inferenceParams.image,
        tag: inferenceParams.tag,
      })
    }

    throw error
  }

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      modelId: modelId,
      image: inferenceParams.image,
      tag: inferenceParams.tag,
    })
  }
  return inference
}

export type UpdateInferenceParams = Pick<InferenceInterface, 'image' | 'tag' | 'description' | 'settings'>
export async function updateInference(
  user: UserDoc,
  modelId: string,
  inferenceParams: UpdateInferenceParams,
): Promise<InferenceDoc> {
  const model = await getModelById(user, modelId)

  const inference = await getInferenceByImage(user, modelId, inferenceParams.image, inferenceParams.tag)
  const auth = await authorisation.model(user, model, ModelAction.Update)

  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId: modelId })
  }

  const updatedInference = await Inference.findOneAndUpdate(
    { modelId: inference.modelId, image: inference.image, tag: inference.tag },
    inferenceParams,
    { new: true },
  )
  if (!updatedInference) {
    throw NotFound(`The requested webhook was not found.`, { updatedInference })
  }
  return updatedInference
}
