import { castArray } from 'lodash'
import https from 'https'
import config from 'config'
import { deleteImageTag } from '../utils/registry'
import { ModelId, ApprovalStates } from '../../types/interfaces'
import DeploymentModel, { DeploymentDoc } from '../models/Deployment'
import { ModelDoc } from '../models/Model'
import { UserDoc } from '../models/User'
import VersionModel, { VersionDoc } from '../models/Version'
import Authorisation from '../external/Authorisation'
import { asyncFilter } from '../utils/general'
import { SerializerOptions } from '../utils/serializers'
import { Forbidden } from '../utils/result'
import { getUserByInternalId } from './user'
import { getEntitiesForUser } from '../utils/entity'

const auth = new Authorisation()

interface GetDeploymentOptions {
  populate?: boolean
  showLogs?: boolean
  overrideFilter?: boolean
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

export function serializedDeploymentFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'name'],
    optional: [],
    serializable: [],
  }
}

export async function filterDeployment<T>(user: UserDoc, unfiltered: T): Promise<T> {
  const deployments = castArray(unfiltered)

  const filtered = await asyncFilter(deployments, (deployment: DeploymentDoc) =>
    auth.canUserSeeDeployment(user, deployment)
  )

  return Array.isArray(unfiltered) ? (filtered as unknown as T) : filtered[0]
}

export async function findDeploymentByUuid(user: UserDoc, uuid: string, opts?: GetDeploymentOptions) {
  let deployment = DeploymentModel.findOne({ uuid })
  if (!opts?.showLogs) deployment = deployment.select({ logs: 0 })
  deployment = deployment
    .populate('model', ['_id', 'uuid', 'latestVersion'])
    .populate('versions', ['version', 'metadata'])

  if (opts?.overrideFilter) return deployment
  return filterDeployment(user, await deployment)
}

export async function findDeploymentById(user: UserDoc, id: ModelId, opts?: GetDeploymentOptions) {
  let deployment = DeploymentModel.findById(id)
  if (opts?.populate) deployment = deployment.populate('model')
  if (!opts?.showLogs) deployment = deployment.select({ logs: 0 })

  if (opts?.overrideFilter) return deployment
  return filterDeployment(user, await deployment)
}
export async function findDeploymentsByModel(user: UserDoc, model: ModelDoc, opts?: GetDeploymentOptions) {
  let deployments = DeploymentModel.find({ model })
  if (opts?.populate) deployments = deployments.populate('model')
  if (!opts?.showLogs) deployments = deployments.select({ logs: 0 })

  if (opts?.overrideFilter) return deployments
  return filterDeployment(user, await deployments)
}

export async function findDeploymentsByVersion(user: UserDoc, version: VersionDoc, opts?: GetDeploymentOptions) {
  let deployments = DeploymentModel.find({ versions: { $in: [version._id] } })
  if (opts?.populate) deployments = deployments.populate('model')
  if (!opts?.showLogs) deployments = deployments.select({ logs: 0 })

  if (opts?.overrideFilter) return deployments
  return filterDeployment(user, await deployments)
}

export interface DeploymentFilter {
  owner?: ModelId
  model?: ModelId
}

export async function findDeployments(user: UserDoc, { owner, model }: DeploymentFilter, opts?: GetDeploymentOptions) {
  const query: any = {}

  if (owner) {
    const ownerUser = await getUserByInternalId(owner)

    if (!ownerUser) {
      throw new Error(`Finding deployments for user that does not exist: ${owner}`)
    }

    const userEntities = await getEntitiesForUser(user)

    query.$or = userEntities.map((userEntity) => ({
      'metadata.contacts.owner': { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    }))
  }
  if (model) query.model = model

  let models = DeploymentModel.find(query).sort({ updatedAt: -1 })

  if (!opts?.showLogs) models = models.select({ logs: 0 })

  return filterDeployment(user, models)
}

export async function markDeploymentBuilt(_id: ModelId) {
  return DeploymentModel.findByIdAndUpdate(_id, { built: true })
}

interface CreateDeployment {
  schemaRef: string | null
  uuid: string

  model: ModelId
  metadata: any

  managerApproved?: ApprovalStates
  ungoverned?: boolean

  owner: ModelId
}

export async function createDeployment(user: UserDoc, data: CreateDeployment) {
  const deployment = new DeploymentModel(data)

  if (!(await auth.canUserSeeDeployment(user, deployment))) {
    throw Forbidden({ data }, 'Unable to create deployment, failed permissions check.')
  }

  await deployment.save()

  return deployment
}

export async function removeModelDeploymentsFromRegistry(model: ModelDoc, deployment: DeploymentDoc) {
  const registry = `${config.get('registry.protocol')}://${config.get('registry.host')}/v2`

  const { versions } = model

  versions.forEach(async (version) => {
    const versionDoc = await VersionModel.findById(version)
    if (!versionDoc) {
      return
    }
    deleteImageTag(
      { address: registry, agent: httpsAgent },
      { namespace: deployment.uuid, model: model.uuid, version: versionDoc.version }
    )
  })
}
