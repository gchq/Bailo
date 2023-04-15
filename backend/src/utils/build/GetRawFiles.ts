/* eslint-disable no-param-reassign */
import { join } from 'path'
import shelljs from 'shelljs'

import { VersionDoc } from '../../types/types.js'
import { getClient } from '../minio.js'
import { BuildLogger } from './BuildLogger.js'
import { BuildOpts, BuildStep, Files } from './BuildStep.js'

const { rm } = shelljs

class GetRawFiles extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props: any) {
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

    const minio = getClient()

    const downloads: Array<Promise<void>> = []
    for (const fileRef of this.props.files) {
      this.logger.info({ fileRef }, `Processing fileRef: ${JSON.stringify(fileRef)}`)
      const path = join(state.workingDirectory, fileRef.path)
      const file = files[fileRef.file]
      this.logger.info({ fileRef, file, files }, `Processing file: ${JSON.stringify(file)}`)
      state[`${fileRef.file}Path`] = path

      downloads.push(minio.fGetObject(file.bucket, file.path, path))
    }

    await Promise.all(downloads)
  }

  async rollback(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    for (const fileRef of this.props.files) {
      const key = `${fileRef.file}Path`

      if (state[key]) {
        rm(state[key])
        state[key] = undefined
      }
    }
  }

  async tidyUp(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function getRawFiles(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger, props: any) => new GetRawFiles(logger, opts, props)
}
