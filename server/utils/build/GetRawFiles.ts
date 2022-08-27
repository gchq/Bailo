import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { mkdir, rm } from 'shelljs'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'
import { getClient } from '../minio'

interface GetRawFilesProps {}
class GetRawFiles extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props: GetRawFilesProps) {
    super(logger, opts, props)

    this.opts.retryable = true
  }

  async name() {
    return 'Download Raw Files'
  }

  async build(_version: VersionDoc, files: Files, state: any): Promise<void> {
    if (!state.workingDirectory) {
      throw new Error('Download raw files requires a working directory')
    }

    // zip paths
    const binaryPath = join(state.workingDirectory, 'binary.zip')
    const codePath = join(state.workingDirectory, 'code.zip')

    // download code bundles
    this.logger.info({ binaryPath, codePath }, 'Downloading code bundles')

    const minio = getClient()
    await Promise.all([
      minio.fGetObject(files.binary.bucket, files.binary.path, binaryPath),
      minio.fGetObject(files.code.bucket, files.code.path, codePath),
    ])

    // update state
    state.binaryPath = binaryPath
    state.codePath = codePath
  }

  async rollback(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (state.binaryPath) {
      rm(state.binaryPath)
      state.binaryPath = undefined
    }

    if (state.codePath) {
      rm(state.codePath)
      state.codePath = undefined
    }
  }

  async tidyup(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function (opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger, props: GetRawFilesProps) => {
    return new GetRawFiles(logger, opts, props)
  }
}
