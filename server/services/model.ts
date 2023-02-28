import config from 'config'
import { castArray } from 'lodash'
import { Types } from 'mongoose'

import { Model, ModelId } from '../../types/interfaces'
import Authorisation from '../external/Authorisation'
import ModelModel from '../models/Model'
import { UserDoc } from '../models/User'
import { VersionDoc } from '../models/Version'
import { simpleEmail } from '../templates/simpleEmail'
import { getEntitiesForUser, getUserListFromEntityList } from '../utils/entity'
import { asyncFilter } from '../utils/general'
import logger from '../utils/logger'
import { Forbidden, NotFound } from '../utils/result'
import { SerializerOptions } from '../utils/serializers'
import { sendEmail } from '../utils/smtp'
import { findDeploymentsByModel } from './deployment'

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
  // Deletes model if no versions left
  const model = await ModelModel.findById(version.model)

  if (!model) {
    throw NotFound({ modelId: version.model }, 'Unable to find model to remove.')
  }

  const deployments = await findDeploymentsByModel(user, model)
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`
  for (const deployment of deployments) {
    const userList = await getUserListFromEntityList(deployment.metadata.contacts.owner)

    for (const owner of userList) {
      if (!user.email) {
        logger.warn({ owner, deployment }, 'Unable able to send email to deployment owner: missing email')
        continue
      }
      sendEmail({
        to: owner.email,
        ...simpleEmail({
          subject: `Your deployment '${deployment.metadata.highLevelDetails.name}' is being updated.`,
          columns: [
            { header: 'Model Name', value: version.metadata.highLevelDetails.name },
            { header: 'Version Name', value: version.version },
            { header: 'Status', value: 'DELETED' },
          ],
          text: `A version of a model you have deployed has been deleted and will be removed from your deployment. 
            You are being notified of this change as it affects a deployment you own named 
            '${deployment.metadata.highLevelDetails.name}'.`,
          buttons: [{ text: 'Deployment Details', href: `${base}/deployment/${deployment.uuid}` }],
        }),
      })
    }

    await model.versions.remove(version._id)
    if (model.versions.length === 0) {
      await model.delete(user._id)
    }
  }
}
