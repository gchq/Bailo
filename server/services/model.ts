import { castArray } from 'lodash'
import { Types } from 'mongoose'
import { Model, ModelId } from '../../types/interfaces'
import ModelModel from '../models/Model'
import { UserDoc } from '../models/User'
import Authorisation from '../external/Authorisation'
import { asyncFilter } from '../utils/general'
import { SerializerOptions } from '../utils/serializers'
import { Forbidden, NotFound } from '../utils/result'
import { VersionDoc } from '../models/Version'
import { getEntitiesForUser } from '../utils/entity'

const auth = new Authorisation()

interface GetModelOptions {
  populate?: boolean
}

export function serializedModelFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'latestVersion.metadata.highLevelDetails.name', 'schemaRef'],
  }
}

export async function filterModel<T>(user: UserDoc, unfiltered: T): Promise<T> {
  const models = castArray(unfiltered)

  const filtered = await asyncFilter(models, (model: Model) => auth.canUserSeeModel(user, model))

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findModelByUuid(user: UserDoc, uuid: string, opts?: GetModelOptions) {
  let model = ModelModel.findOne({ uuid })
  if (opts?.populate) model = model.populate('latestVersion', 'metadata')
  return filterModel(user, await model)
}

export async function findModelById(user: UserDoc, id: string | Types.ObjectId, opts?: GetModelOptions) {
  let model = ModelModel.findById(id)
  if (opts?.populate) model = model.populate('latestVersion', 'metadata')
  return filterModel(user, await model)
}

export interface ModelFilter {
  filter?: string
  type: 'favourites' | 'user' | 'all'
}

export function isValidType(type: unknown): type is 'favourites' | 'user' | 'all' {
  return typeof type === 'string' && ['favourites', 'user', 'all'].includes(type)
}

export function isValidFilter(filter: unknown): filter is string {
  return typeof filter === 'string'
}

export async function findModels(user: UserDoc, { filter, type }: ModelFilter, opts?: GetModelOptions) {
  const query: any = {}

  if (filter) query.$text = { $search: filter as string }

  if (type === 'favourites') {
    query._id = { $in: user.favourites }
  } else if (type === 'user') {
    const userEntities = await getEntitiesForUser(user)

    query.$or = userEntities.map((userEntity) => ({
      'latestVersion.metadata.contacts.uploader': { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    }))
  }

  let models = ModelModel.find(query).sort({ updatedAt: -1 })
  if (opts?.populate) models = models.populate('latestVersion', 'metadata')
  return filterModel(user, await models)
}

export async function createModel(user: UserDoc, data: Model) {
  const model = new ModelModel(data)

  if (!(await auth.canUserSeeModel(user, model))) {
    throw Forbidden({ data }, 'Unable to create model, failed permissions check.')
  }

  await model.save()

  return model
}

export async function deleteModel(user: UserDoc, modelId: ModelId) {
  const model = await ModelModel.findById(modelId)

  if (!model) {
    throw NotFound({ modelId }, 'Unable to find model to remove.')
  }

  await model.delete(user._id)
}

export async function removeVersionFromModel(user: UserDoc, version: VersionDoc) {
  const model = await ModelModel.findById(version.model)
  if (!model) {
    throw NotFound({ modelId: version.model }, 'Unable to find model to remove.')
  }

  await model.versions.remove(version._id)
  // Deletes model if no versions left, updates latest version id if that version has been removed
  if (model.versions.length === 0) {
    await model.delete(user._id)
  } else if (version._id.equals(model.latestVersion)) {
    const latestVersion = model.versions.at(-1)
    if (!latestVersion) {
      throw NotFound({ code: 'version_not_found', ModelId: model._id }, 'Unable to set latest version for model')
    }
    model.latestVersion = latestVersion
  }
  await model.save()
}
