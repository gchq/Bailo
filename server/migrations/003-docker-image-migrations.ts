import logger from '../utils/logger'
import DeploymentModel from '../models/Deployment'
import ModelModel from '../models/Model'
import VersionModel from '../models/Version'
import { copyDockerImage } from '../utils/registry'

export async function up() {
  const deployments = await DeploymentModel.find({})

  for (const deployment of deployments) {
    if (deployment.managerApproved) {
      const model = await ModelModel.findById(deployment.model)
      if (!model) throw new Error('Model not found')

      for (const versionId of deployment.versions) {
        const version = await VersionModel.findById(versionId)
        if (!version) throw new Error('Version not found')

        await copyDockerImage(
          { namespace: 'internal', image: model.uuid, version: version.version },
          { namespace: deployment.uuid, image: model.uuid, version: version.version },
          (level: string, message: string) => {
            logger[level](message)
          }
        )
      }
    }
  }

  logger.info('Migrated all Docker image locations')
}

export async function down() {
  // not implemented
}
