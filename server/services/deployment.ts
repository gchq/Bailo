import { castArray } from 'lodash'

import { Forbidden } from '../utils/result'
import DeploymentModel from '../models/Deployment'
import { Deployment, User, ModelId } from '../../types/interfaces'
import AuthorisationBase from '../utils/AuthorisationBase'
import { asyncFilter } from '../utils/general'
import { createSerializer, SerializerOptions } from '../utils/logger'
import { serializedModelFields } from './model'

const authorisation = new AuthorisationBase()

interface GetDeploymentOptions {
  populate?: boolean
}

export function serializedDeploymentFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'name'],
    optional: [],
    serializable: [{ type: createSerializer(serializedModelFields()), field: 'model' }],
  }
}

export async function filterDeployment<T>(user: User, unfiltered: T): Promise<T> {
  const deployments = castArray(unfiltered)

  const filtered = await asyncFilter(deployments, (deployment: Deployment) =>
    authorisation.canUserSeeDeployment(user, deployment)
  )

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findDeploymentByUuid(user: User, uuid: string, opts?: GetDeploymentOptions) {
  let deployment = await DeploymentModel.findOne({ uuid })
  if (opts?.populate) deployment = deployment.populate('model')

  return filterDeployment(user, deployment)
}

export async function findDeploymentById(user: User, id: ModelId, opts?: GetDeploymentOptions) {
  let deployment = await DeploymentModel.findById(id)
  if (opts?.populate) deployment = deployment.populate('model')

  return filterDeployment(user, deployment)
}

export interface DeploymentFilter {
  owner?: ModelId
  model?: ModelId
}

export async function findDeployments(user: User, { owner, model }: DeploymentFilter) {
  const query: any = {}

  if (owner) query.owner = owner
  if (model) query.model = model

  const models = await DeploymentModel.find(query).sort({ updatedAt: -1 })
  return filterDeployment(user, models)
}

export async function markDeploymentBuilt(_id: ModelId) {
  return DeploymentModel.findByIdAndUpdate(_id, { built: true })
}

interface CreateDeployment {
  schemaRef: string
  uuid: string

  model: ModelId
  metadata: any

  owner: ModelId
}

export async function createDeployment(user: User, data: CreateDeployment) {
  const deployment = new DeploymentModel(data)

  if (!authorisation.canUserSeeDeployment(user, deployment)) {
    throw Forbidden({ data }, 'Unable to create deployment, failed permissions check.')
  }

  await deployment.save()

  return deployment
}
