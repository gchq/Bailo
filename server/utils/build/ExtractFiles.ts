import { join } from 'path'
import { rm } from 'shelljs'
import unzip from 'unzipper'
import { dirname } from 'path'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'
import { getClient } from '../minio'

async function unzipFile(zipPath: string) {
  const outputDir = dirname(zipPath)

  await unzip.Open.file(zipPath).then((d) => d.extract({ path: outputDir, concurrency: 5 }))
}

interface ExtractFilesProps {}
class ExtractFiles extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props: ExtractFilesProps) {
    super(logger, opts, props)

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

export default function (opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger, props: ExtractFilesProps) => {
    return new ExtractFiles(logger, opts, props)
  }
}
