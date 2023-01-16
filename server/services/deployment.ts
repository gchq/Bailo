import { castArray } from 'lodash'
import { DirectoryArrayMetadata, DirectoryMetadata, ModelId } from '../../types/interfaces'
import DeploymentModel, { DeploymentDoc } from '../models/Deployment'
import { UserDoc } from '../models/User'
import { VersionDoc } from '../models/Version'
import Authorisation from '../external/Authorisation'
import { asyncFilter } from '../utils/general'
import { createSerializer, SerializerOptions } from '../utils/logger'
import { Forbidden } from '../utils/result'
import { serializedModelFields } from './model'
import { getUserByInternalId } from './user'
import { getEntitiesForUser } from '../utils/entity'
import { deleteImageTag, createRegistryClient } from '../utils/registry'
import { deleteRequestsByDeployment } from './request'

const auth = new Authorisation()

interface GetDeploymentOptions {
  populate?: boolean
  showLogs?: boolean
  overrideFilter?: boolean
}

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

export async function deleteDeploymentsByVersion(user: UserDoc, version: VersionDoc) {
  const registry = await createRegistryClient()

  const deployments = await findDeploymentsByVersion(user, version)

  // For all deployments
  await Promise.all(
    deployments.map(async (deployment) => {
      // Delete image from registry
      await deleteImageTag(registry, {
        model: deployment.metadata.highLevelDetails.modelID,
        namespace: user.id,
        version: version.version,
      })

      // Remove version from deployments
      await deployment.versions.remove(version._id)

      // Delete requests for deployment
      await deleteRequestsByDeployment(user, deployment)

      // If there are no versions left, remove the deployment
      if (deployment.versions.length === 0) {
        await deployment.delete(user._id)
      }
    })
  )
}

// export const addToTree = (tree: DirectoryMetadata | undefined, path: string): void => {
//   if (!tree) {
//     throw new Error('Unable to create file list')
//   }
//   if (path.includes('/')) {
//     const index = path.indexOf('/')
//     const splitPath = [path.slice(0, index), path.slice(index + 1)]
//     if (!tree.directories.has(splitPath[0])) {
//       tree.directories.set(splitPath[0], { name: `${splitPath[0]}/`, directories: new Map(), files: [] })
//     }
//     if (splitPath[1].length > 0) {
//       addToTree(tree.directories.get(splitPath[0]), splitPath[1])
//     }
//   } else {
//     tree.files.push(path)
//   }
// }

// export const createTree = (rootName: string, files: string[]): DirectoryMetadata => {
//   const tree: DirectoryMetadata = { name: `${rootName}/`, directories: new Map(), files: [] }
//   files.forEach((file) => addToTree(tree, file))
//   return tree
// }

export const createTree = (files: string[]) => {
  let result = []
  if (files) {
    result = files.reduce((r, p) => {
      const names = p.split('/')
      if (names) {
        names.reduce((q: any, name) => {
          let temp: any = q.find((o: any) => o.name === name)
          if (!temp) q.push((temp = { name, children: [] }))
          return temp.children
        }, r)
      }
      return r
    }, [])
  }
  return {
    name: 'Code files',
    children: [...result],
  }
}

// export const treeWithArrays = (tree: DirectoryMetadata): DirectoryArrayMetadata => {
//   const directories: DirectoryArrayMetadata[] = []
//   tree.directories.forEach((item) => directories.push(treeWithArrays(item)))
//   return { name: tree.name, directories, files: tree.files }
// }
