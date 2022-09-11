/* eslint-disable no-param-reassign */
import { dirname } from 'path'
import { rm } from 'shelljs'
import unzip from 'unzipper'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'

async function unzipFile(zipPath: string) {
  const outputDir = dirname(zipPath)

  await unzip.Open.file(zipPath).then((d) => d.extract({ path: outputDir, concurrency: 5 }))
}

class ExtractFiles extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

    this.opts.retryable = false
  }

  async name() {
    return 'Extract Files'
  }

  async build(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (!state.binaryPath || !state.codePath) {
      throw new Error('Extract files requires a binary and code path')
    }

    // extract bundles
    this.logger.info({ ...state }, 'Extracting zip bundles')

    await Promise.all([unzipFile(state.binaryPath), unzipFile(state.codePath)])

    // delete old bundles
    this.logger.info({ ...state }, 'Removing zip bundles')
    rm(state.binaryPath, state.codePath)
  }

  async rollback(_version: VersionDoc, _files: Files, _state: any): Promise<void> {
    // nothing to do
  }
}

export default function extractFiles(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new ExtractFiles(logger, opts)
}
