/* eslint-disable no-param-reassign */
import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { mkdir, rm } from 'shelljs'

import { VersionWithModel } from '../../../types/models/version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'

class CreateWorkingDirectory extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

    this.opts.retryable = true
  }

  async name() {
    return 'Create Temporary Working Directory'
  }

  async build(_version: VersionWithModel, _files: Files, state: any) {
    const directory = join(tmpdir(), uuidv4())
    await mkdir(directory)

    state.workingDirectory = directory
  }

  async rollback(_version: VersionWithModel, _files: Files, state: any) {
    if (state.workingDirectory) {
      rm('-rf', state.workingDirectory)
    }

    state.workingDirectory = undefined
  }

  async tidyUp(version: VersionWithModel, files: Files, state: any) {
    return this.rollback(version, files, state)
  }
}

export default function createWorkingDirectory(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new CreateWorkingDirectory(logger, opts)
}
