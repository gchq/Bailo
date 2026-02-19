import { ClientSession } from 'mongoose'

import { createInferenceService, deleteInferenceService, updateInferenceService } from '../clients/inferencing.js'
import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import InferenceModel, { InferenceDoc, InferenceId, InferenceInterface } from '../models/Inference.js'
import { ModelDoc } from '../models/Model.js'
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

  const inference = await InferenceModel.findOne({
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

  const inferenceService = {
    modelId: modelId,
    image: inferenceParams.image,
    tag: inferenceParams.tag,
    port: inferenceParams.settings.port,
  }

  await createInferenceService(inferenceService)

  const inference = new InferenceModel({
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

  const inferenceService = {
    modelId: modelId,
    image: image,
    tag: tag,
    port: inferenceParams.settings.port,
  }

  await updateInferenceService(inferenceService)

  const updatedInference = await InferenceModel.findOneAndUpdate(
    { modelId: inference.modelId, image: inference.image, tag: inference.tag },
    inferenceParams,
    { new: true },
  )
  if (!updatedInference) {
    throw NotFound(`The requested inference service was not found.`, { updatedInference })
  }

  return updatedInference
}

export async function removeInferences(user: UserInterface, inferenceIds: InferenceId[], session?: ClientSession) {
  const inferences: InferenceDoc[] = []
  // Model cache
  const models: Record<string, ModelDoc> = {}

  for (const inferenceId of inferenceIds) {
    let model: ModelDoc
    if (inferenceId.modelId in models) {
      model = models[inferenceId.modelId]
    } else {
      model = await getModelById(user, inferenceId.modelId)
      models[inferenceId.modelId] = model

      // Only check auth for a newly found model
      for (const authAction of [ModelAction.View, ModelAction.Delete]) {
        const auth = await authorisation.model(user, model, authAction)
        if (!auth.success) {
          throw Forbidden(auth.info, { userDn: user.dn, modelId: inferenceId.modelId })
        }
      }
    }

    const inference = await InferenceModel.findOne({ ...inferenceId })
    if (!inference) {
      throw NotFound('The requested inferencing service was not found.', { ...inferenceId })
    }

    await deleteInferenceService(inferenceId.image)
    await inference.delete(session)

    inferences.push(inference)
  }

  return inferences
}

export async function removeInference(
  user: UserInterface,
  modelId: string,
  image: string,
  tag: string,
  session?: ClientSession,
) {
  return (await removeInferences(user, [{ modelId, image, tag }], session))[0]
}
