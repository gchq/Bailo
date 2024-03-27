import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import InferenceModel, { InferenceDoc, InferenceInterface } from '../models/Inference.js'
import Inference from '../models/Inference.js'
import { UserInterface } from '../models/User.js'
import { BadReq, Forbidden, NotFound } from '../utils/error.js'
import { isMongoServerError } from '../utils/mongo.js'
import { getModelById } from './model.js'
import { listModelImages } from './registry.js'

export async function getInferenceByImage(user: UserInterface, modelId: string, image: string, tag: string) {
  const model = await getModelById(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const inference = await Inference.findOne({
    modelId,
    image,
    tag,
  })

  if (!inference) {
    throw NotFound(`The requested inferencing service was not found.`, { modelId, image, tag })
  }

  return inference
}

export async function getInferencesByModel(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const inferences = await InferenceModel.find({ modelId })

  return inferences
}

export type CreateInferenceParams = Pick<InferenceInterface, 'image' | 'tag' | 'description' | 'settings'>

export async function createInference(user: UserInterface, modelId: string, inferenceParams: CreateInferenceParams) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, ModelAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      modelId: modelId,
      image: inferenceParams.image,
      tag: inferenceParams.tag,
    })
  }

  // Check that an image exists in the registry
  const images = await listModelImages(user, modelId)

  const image = images.find((image) => image.repository === modelId && image.name === inferenceParams.image)

  if (!image?.tags.includes(inferenceParams.tag)) {
    throw NotFound(`Image ${inferenceParams.image}:${inferenceParams.tag} was not found on this model.`, {
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

  return inference
}

export type UpdateInferenceParams = Pick<InferenceInterface, 'description' | 'settings'>
export async function updateInference(
  user: UserInterface,
  modelId: string,
  image: string,
  tag: string,
  inferenceParams: UpdateInferenceParams,
): Promise<InferenceDoc> {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, ModelAction.Update)

  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId: modelId })
  }
  const inference = await getInferenceByImage(user, modelId, image, tag)

  const updatedInference = await Inference.findOneAndUpdate(
    { modelId: inference.modelId, image: inference.image, tag: inference.tag },
    inferenceParams,
    { new: true },
  )
  if (!updatedInference) {
    throw NotFound(`The requested inference service was not found.`, { updatedInference })
  }
  return updatedInference
}
