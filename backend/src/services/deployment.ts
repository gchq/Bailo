import Authorisation from '../connectors/Authorisation.js'
import DeploymentModel from '../models/Deployment.js'
import VersionModel from '../models/Version.js'
import { simpleEmail } from '../templates/simpleEmail.js'
import { ApprovalStates, DeploymentDoc, ModelDoc, ModelId, UserDoc, VersionDoc } from '../types/types.js'
import config from '../utils/config.js'
import { getEntitiesForUser, getUserListFromEntityList } from '../utils/entity.js'
import { asyncFilter } from '../utils/general.js'
import logger from '../utils/logger.js'
import { Forbidden } from '../utils/result.js'
import { deleteImageTag } from '../utils/skopeo.js'
import { sendEmail } from '../utils/smtp.js'
import { getUserByInternalId } from './user.js'

const auth = new Authorisation()
const base = `${config.app.protocol}://${config.app.host}:${config.app.port}`

interface GetDeploymentOptions {
  populate?: boolean
  showLogs?: boolean
  overrideFilter?: boolean
}

export async function filterDeploymentArray(user: UserDoc, unfiltered: Array<DeploymentDoc>) {
  return asyncFilter(unfiltered, (deployment: DeploymentDoc) => auth.canUserSeeDeployment(user, deployment))
}

export async function filterDeployment(user: UserDoc, unfiltered: DeploymentDoc | null) {
  if (!unfiltered) {
    return null
  }

  if (!(await auth.canUserSeeDeployment(user, unfiltered))) {
    return null
  }

  return unfiltered
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

export async function findDeploymentById(user: UserDoc, id: ModelId | DeploymentDoc, opts?: GetDeploymentOptions) {
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
  return filterDeploymentArray(user, await deployments)
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

  let deployments = DeploymentModel.find(query).sort({ updatedAt: -1 })

  if (!opts?.showLogs) deployments = deployments.select({ logs: 0 })

  return filterDeploymentArray(user, await deployments)
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
  const { versions } = model

  versions.forEach(async (version: any) => {
    const versionDoc = await VersionModel.findById(version)
    if (!versionDoc) {
      return
    }
    deleteImageTag({ namespace: deployment.uuid, model: model.uuid, version: versionDoc.version }, (level, msg) =>
      logger[level](msg),
    )
  })
}

export async function emailDeploymentOwnersOnVersionDeletion(deployments: DeploymentDoc[], version: VersionDoc) {
  for (const deployment of deployments) {
    const userList = await getUserListFromEntityList(deployment.metadata.contacts.owner)

    if (userList.length > 20) {
      // refusing to send more than 20 emails.
      logger.warn({ count: userList.length, deployment }, 'Refusing to send too many emails')
      return
    }
    for (const owner of userList) {
      if (!owner.email) {
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
  }
}
