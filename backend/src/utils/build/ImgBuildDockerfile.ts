/* eslint-disable no-param-reassign */
import { readFile, writeFile } from 'fs/promises'
import { set } from 'lodash-es'
import { homedir } from 'os'
import { join } from 'path'

import { getAdminToken } from '../../routes/registryAuth.js'
import { ModelDoc, VersionDoc } from '../../types/types.js'
import config from '../config.js'
import { checkFileExists, ensurePathExists } from '../filesystem.js'
import { logCommand } from './build.js'
import { BuildLogger } from './BuildLogger.js'
import { BuildOpts, BuildStep, Files } from './BuildStep.js'

async function setRegistryLogin(registry: string, username: string, password: string) {
  const folder = join(homedir(), '.docker')
  await ensurePathExists(folder)

  const file = join(folder, 'config.json')

  let base
  if (await checkFileExists(file)) {
    base = JSON.parse(await readFile(file, { encoding: 'utf-8' }))
  } else {
    base = {
      auths: {},
    }
  }

  set(base, `auths.${registry}`, {
    auth: Buffer.from(`${username}:${password}`).toString('base64'),
  })

  await writeFile(file, JSON.stringify(base, null, 2))
}

class ImgBuildDockerfile extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

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

    const tag = `${config.registry.connection.host}/internal/${(version.model as ModelDoc).uuid}:${version.version}`
    state.tag = tag

    // build image
    const buildCommand = `img build -f ${dockerfilePath} -t ${tag} ${buildDir}`
    this.logger.info({ buildCommand }, 'Building Dockerfile')
    await logCommand(buildCommand, this.logger)

    // push image
    this.logger.info({ tag }, 'Pushing image to docker')

    await setRegistryLogin(config.registry.connection.host, 'admin', await getAdminToken())
    this.logger.info({}, 'Successfully logged into docker')

    await logCommand(`img push ${tag}`, this.logger)
  }

  async rollback(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (state.tag) {
      const removeImageCmd = `img rm ${state.tag}`
      await logCommand(removeImageCmd, this.logger)
    }
  }

  async tidyUp(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function imgBuildDockerfile(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new ImgBuildDockerfile(logger, opts)
}
