import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { mkdir, rm } from 'shelljs'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'

interface CreateWorkingDirectoryProps {}
class CreateWorkingDirectory extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props: CreateWorkingDirectoryProps) {
    super(logger, opts, props)

    this.opts.retryable = true
  }

  async name() {
    return 'Create Temporary Working Directory'
  }

  async build(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    const directory = join(tmpdir(), uuidv4())
    await mkdir(directory)

    state.workingDirectory = directory
  }

  async rollback(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (state.workingDirectory) {
      rm('-rf', state.workingDirectory)
    }

    state.workingDirectory = undefined
  }

  async tidyup(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function (opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger, props: CreateWorkingDirectoryProps) => {
    return new CreateWorkingDirectory(logger, opts, props)
  }
}
