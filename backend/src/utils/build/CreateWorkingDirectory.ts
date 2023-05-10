/* eslint-disable no-param-reassign */
import { tmpdir } from 'os'
import { join } from 'path'
import shelljs from 'shelljs'
import { v4 as uuidv4 } from 'uuid'

import { VersionDoc } from '../../types/types.js'
import { BuildLogger } from './BuildLogger.js'
import { BuildOpts, BuildStep, Files } from './BuildStep.js'

const { mkdir, rm } = shelljs

class CreateWorkingDirectory extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

    this.opts.retryable = true
  }

  async name() {
    return 'Create Temporary Working Directory'
  }

  async build(_version: VersionDoc, _files: Files, state: any) {
    const directory = join(tmpdir(), uuidv4())
    await mkdir(directory)

    state.workingDirectory = directory
  }

  async rollback(_version: VersionDoc, _files: Files, state: any) {
    if (state.workingDirectory) {
      rm('-rf', state.workingDirectory)
    }

    state.workingDirectory = undefined
  }

  async tidyUp(version: VersionDoc, files: Files, state: any) {
    return this.rollback(version, files, state)
  }
}

export default function createWorkingDirectory(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new CreateWorkingDirectory(logger, opts)
}
