import DeploymentModel from '../models/Deployment.js'
import ModelModel from '../models/Model.js'
import VersionModel from '../models/Version.js'
import logger from '../utils/logger.js'
import { copyDockerImage, createRegistryClient } from '../utils/registry.js'

export async function up() {
  const deployments = await DeploymentModel.find({})

  for (const deployment of deployments) {
    if (deployment.managerApproved) {
      const model = await ModelModel.findById(deployment.model)
      if (!model) throw new Error('Model not found')

      for (const versionId of model.versions) {
        const version = await VersionModel.findById(versionId)
        if (!version) throw new Error('Version not found')

        const registry = await createRegistryClient()
        await copyDockerImage(
          registry,
          { namespace: 'internal', model: model.uuid, version: version.version },
          { namespace: deployment.uuid, model: model.uuid, version: version.version },
          (level: 'info' | 'error', message: string) => {
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
