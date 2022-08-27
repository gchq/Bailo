import { rm, mkdir } from 'shelljs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { writeFile } from 'fs/promises'
import dedent from 'dedent-js'
import config from 'config'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'
import { ModelDoc } from '../../models/Model'
import { logCommand, runCommand } from './build'
import { getAdminToken } from '../../routes/v1/registryAuth'

interface ImgBuildDockerfileProps {}
class ImgBuildDockerfile extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props: ImgBuildDockerfileProps) {
    super(logger, opts, props)

    this.opts.retryable = true
  }

  async name() {
    return 'Build Dockerfile using Img'
  }

  async build(version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (!state.workingDirectory) {
      throw new Error('Build dockerfile requires a working directory')
    }

    const { dockerfilePath, buildDir } = state

    const tag = `${config.get('registry.host')}/internal/${(version.model as ModelDoc).uuid}:${version.version}`
    state.tag = tag

    // build image
    const buildCommand = `img build -f ${dockerfilePath} -t ${tag} ${buildDir}`
    this.logger.info({ buildCommand }, 'Building Dockerfile')
    await logCommand(buildCommand, this.logger)

    // push image
    this.logger.info({ tag }, 'Pushing image to docker')

    // using docker instead of img login because img reads from ~/.docker/config and
    // does not fully populate authorization headers (clientId and account) in authorization
    // requests like docker does. docker login doesn't require docker to be running in host
    await runCommand(
      `docker login ${config.get('registry.host')} -u admin -p ${await getAdminToken()}`,
      this.logger.logger.info.bind(this.logger.logger),
      this.logger.logger.error.bind(this.logger.logger),
      { hide: true }
    )
    this.logger.info({}, 'Successfully logged into docker')

    await logCommand(`img push ${tag}`, this.logger)
  }

  async rollback(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (state.tag) {
      const removeImageCmd = `img rm ${state.tag}`
      await logCommand(removeImageCmd, this.logger)
    }
  }

  async tidyup(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function (opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger, props: ImgBuildDockerfileProps) => {
    return new ImgBuildDockerfile(logger, opts, props)
  }
}
