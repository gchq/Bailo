import { castArray } from 'lodash'
import https from 'https'
import config from 'config'
import { ModelId } from '../../types/interfaces'
import DeploymentModel, { DeploymentDoc } from '../models/Deployment'
import { UserDoc } from '../models/User'
import { VersionDoc } from '../models/Version'
import Authorisation from '../external/Authorisation'
import { asyncFilter } from '../utils/general'
import logger, { createSerializer, SerializerOptions } from '../utils/logger'
import { BadReq, Forbidden } from '../utils/result'
import { serializedModelFields } from './model'
import { getAccessToken } from '../routes/v1/registryAuth'
import { getErrorMessage } from '../../utils/fetcher'

const auth = new Authorisation()

interface GetDeploymentOptions {
  populate?: boolean
  showLogs?: boolean
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

export function serializedDeploymentFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'name'],
    optional: [],
    serializable: [{ type: createSerializer(serializedModelFields()), field: 'model' }],
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
  deployment = deployment.populate('model', ['_id', 'uuid']).populate('versions', ['version', 'metadata'])

  return filterDeployment(user, await deployment)
}

export async function findDeploymentById(user: UserDoc, id: ModelId, opts?: GetDeploymentOptions) {
  let deployment = DeploymentModel.findById(id)
  if (opts?.populate) deployment = deployment.populate('model')
  if (!opts?.showLogs) deployment = deployment.select({ logs: 0 })

  return filterDeployment(user, await deployment)
}

export interface DeploymentFilter {
  owner?: ModelId
  model?: ModelId
}

export async function findDeployments(user: UserDoc, { owner, model }: DeploymentFilter, opts?: GetDeploymentOptions) {
  const query: any = {}

  if (owner) query.owner = owner
  if (model) query.model = model

  let models = DeploymentModel.find(query).sort({ updatedAt: -1 })

  if (!opts?.showLogs) models = models.select({ logs: 0 })

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

  if (!(await auth.canUserSeeDeployment(user, deployment))) {
    throw Forbidden({ data }, 'Unable to create deployment, failed permissions check.')
  }

  await deployment.save()

  return deployment
}

export async function updateDeploymentVersions(user: UserDoc, modelId: ModelId, version: VersionDoc) {
  const deployments = await findDeployments(user, { model: modelId })
  await Promise.all(
    deployments.map((deployment) => {
      deployment.versions.push(version)
      return deployment.save()
    })
  )
}

export async function deleteRegistryObjects(model: string, version: string, namespace: string) {
  const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
    { type: 'repository', name: `${namespace}/${model}`, actions: ['push', 'pull', 'delete'] },
  ])
  const authorisation = `Bearer ${token}`
  const registry = `https://${config.get('registry.host')}/v2`

  const headResponse = await registryFetch(registry, namespace, model, version, authorisation, 'HEAD')

  if (!headResponse.ok) {
    const error = `Unable to get registry image: ${await headResponse.text()}`
    logger.error({ registry, namespace, model, version }, error)
    throw new Error(error)
  }

  const deleteResponse = await registryFetch(
    registry,
    namespace,
    model,
    headResponse.headers.get('docker-content-digest'),
    authorisation,
    'DELETE'
  )

  if (!deleteResponse.ok) {
    const error = `Unable to delete registry image: ${await headResponse.text()}`
    logger.error({ registry, namespace, model }, error)
    throw new Error(error)
  }
}

async function registryFetch(
  registry: string,
  namespace: string,
  modelID: string,
  image: string,
  authorisation: string,
  method: string
) {
  return fetch(`${registry}/${namespace}/${modelID}/manifests/${image}`, {
    method,
    headers: {
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
      Authorization: authorisation,
    },
    agent: httpsAgent,
  } as RequestInit).then((res: any) => res)
}
