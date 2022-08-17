import _ from 'lodash'

import { Forbidden } from '../utils/result.js'
import DeploymentModel, { DeploymentDoc } from '../models/Deployment.js'
import { ModelId } from '../../types/interfaces.js'
import AuthorisationBase from '../utils/AuthorisationBase.js'
import { asyncFilter } from '../utils/general.js'
import { createSerializer, SerializerOptions } from '../utils/logger.js'
import { serializedModelFields } from './model.js'
import { UserDoc } from '../models/User.js'
import { VersionDoc } from '../models/Version.js'

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

export async function filterDeployment<T>(user: UserDoc, unfiltered: T): Promise<T> {
  const deployments = _.castArray(unfiltered)

  const filtered = await asyncFilter(deployments, (deployment: DeploymentDoc) =>
    authorisation.canUserSeeDeployment(user, deployment)
  )

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findDeploymentByUuid(user: UserDoc, uuid: string, opts?: GetDeploymentOptions) {
  let deployment = DeploymentModel.findOne({ uuid })
  if (opts?.populate) deployment = deployment.populate('model')

  return filterDeployment(user, await deployment)
}

export async function findDeploymentById(user: UserDoc, id: ModelId, opts?: GetDeploymentOptions) {
  let deployment = DeploymentModel.findById(id)
  if (opts?.populate) deployment = deployment.populate('model')

  return filterDeployment(user, await deployment)
}

export interface DeploymentFilter {
  owner?: ModelId
  model?: ModelId
}

export async function findDeployments(user: UserDoc, { owner, model }: DeploymentFilter) {
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

  versions: Array<VersionDoc>
  model: ModelId
  metadata: any

  owner: ModelId
}

export async function createDeployment(user: UserDoc, data: CreateDeployment) {
  const deployment = new DeploymentModel(data)

  if (!(await authorisation.canUserSeeDeployment(user, deployment))) {
    throw Forbidden({ data }, 'Unable to create deployment, failed permissions check.')
  }

  await deployment.save()

  return deployment
}

export async function updateDeploymentVersions(user: UserDoc, modelId: ModelId, version: VersionDoc) {
  const deployments = await findDeployments(user, { model: modelId })
  if (deployments.length !== 0) {
    deployments.forEach((deployment: DeploymentDoc) => {
      deployment.versions.push(version)
      deployment.save()
    })
  }
}
