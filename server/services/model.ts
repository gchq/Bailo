import { Types } from 'mongoose'
import _ from 'lodash'

import { Forbidden } from '../utils/result.js'
import ModelModel from '../models/Model.js'
import { Model } from '../../types/interfaces.js'
import AuthorisationBase from '../utils/AuthorisationBase.js'
import { asyncFilter } from '../utils/general.js'
import { SerializerOptions } from '../utils/logger.js'
import { UserDoc } from '../models/User.js'

const authorisation = new AuthorisationBase()

export function serializedModelFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'currentMetadata.highLevelDetails.name', 'schemaRef'],
  }
}

export async function filterModel<T>(user: UserDoc, unfiltered: T): Promise<T> {
  const models = _.castArray(unfiltered)

  const filtered = await asyncFilter(models, (model: Model) => authorisation.canUserSeeModel(user, model))

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findModelByUuid(user: UserDoc, uuid: string) {
  const model = await ModelModel.findOne({ uuid })
  return filterModel(user, model)
}

export async function findModelById(user: UserDoc, id: string | Types.ObjectId) {
  const model = await ModelModel.findById(id)
  return filterModel(user, model)
}

export interface ModelFilter {
  filter?: string
  type: 'favourites' | 'user' | 'all'
}

export function isValidType(type: any): type is 'favourites' | 'user' | 'all' {
  return typeof type === 'string' && ['favourites', 'user', 'all'].includes(type)
}

export function isValidFilter(filter: any): filter is string {
  return typeof filter === 'string'
}

export async function findModels(user: UserDoc, { filter, type }: ModelFilter) {
  const query: any = {}

  if (filter) query.$text = { $search: filter as string }

  if (type === 'favourites') {
    query._id = { $in: user.favourites }
  } else if (type === 'user') {
    query.owner = user._id
  }

  const models = await ModelModel.find(query).sort({ updatedAt: -1 })
  return filterModel(user, models)
}

export async function createModel(user: UserDoc, data: Model) {
  const model = new ModelModel(data)

  if (!(await authorisation.canUserSeeModel(user, model))) {
    throw Forbidden({ data }, 'Unable to create model, failed permissions check.')
  }

  await model.save()

  return model
}
