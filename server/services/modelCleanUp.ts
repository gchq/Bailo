import { UserDoc } from '../models/User'
import DeploymentModel from '../models/Deployment'
import RequestModel from '../models/Request'
import { VersionDoc } from '../models/Version'
import { deleteRegistryObjects } from './deployment'
import ModelModel from '../models/Model'

export async function deleteVersionRequests(version: VersionDoc, user: UserDoc) {
  const versionRequests = await RequestModel.find({ version: version._id })
  await Promise.all(versionRequests.map((versionRequest) => versionRequest.delete(user._id)))
}

export async function deleteDeploymentsByVersion(version: VersionDoc, user: UserDoc) {
  const deployments = await DeploymentModel.find({ versions: { $in: [version._id] } })
  await Promise.all(
    deployments.map(async (deployment) => {
      await deleteRegistryObjects(deployment.metadata.highLevelDetails.modelID, version.version, user.id)
      await deployment.versions.remove(version._id)
      const deploymentRequests = await RequestModel.find({ deployment: deployment._id })
      await Promise.all(deploymentRequests.map((deploymentRequest) => deploymentRequest.delete(user._id)))
      if (deployment.versions.length === 0) {
        await deployment.delete(user._id)
      } else {
        await deployment.save()
      }
    })
  )
}

export async function deleteModelByVersion(version: VersionDoc, user: UserDoc) {
  const model = await ModelModel.findById(version.model)
  if (model) {
    await model.versions.remove(version._id)
    if (model.versions.length === 0) {
      await model.delete(user._id)
    } else {
      await model.save()
    }
  }
}
