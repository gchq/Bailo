/* eslint-disable no-param-reassign */
import shelljs from 'shelljs'

import { ModelDoc, VersionDoc } from '../../types/types.js'
import { ImageRef, uploadDockerExport } from '../skopeo.js'
import { BuildLogger } from './BuildLogger.js'
import { BuildOpts, BuildStep, Files } from './BuildStep.js'

const { rm } = shelljs

class PushDockerTar extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

    this.opts.retryable = false
  }

  async name() {
    return 'Push Docker Tar'
  }

  async build(version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (!state.dockerPath) {
      throw new Error('Push docker tar requires a docker path')
    }

    const image: ImageRef = {
      namespace: 'internal',
      model: (version.model as ModelDoc).uuid,
      version: version.version,
    }

    await uploadDockerExport(state.dockerPath, image, (level, msg) => this.logger[level]({}, msg))

    this.logger.info({ image }, `Finished pushing to ${image.namespace}/${image.model}:${image.version}`)

    // delete old source
    this.logger.info({ ...state }, 'Deleting old docker tar')
    rm(state.dockerPath)
  }

  async rollback(_version: VersionDoc, _files: Files, _state: any): Promise<void> {
    // Nothing to do, working directory is cleared by the
    // CreateWorkingDirectory build step.
  }
}

export default function pushDockerTar(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new PushDockerTar(logger, opts)
}
