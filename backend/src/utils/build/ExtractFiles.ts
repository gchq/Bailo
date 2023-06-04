/* eslint-disable no-param-reassign */
import { readdir } from 'fs/promises'
import { dirname, join } from 'path'
import shelljs from 'shelljs'
import unzip from 'unzipper'

import { VersionDoc } from '../../types/types.js'
import { BuildLogger } from './BuildLogger.js'
import { BuildOpts, BuildStep, Files } from './BuildStep.js'

const { rm } = shelljs

async function unzipFile(zipPath: string) {
  console.log('Extract', zipPath)
  const outputDir = dirname(zipPath)

  await unzip.Open.file(zipPath).then((d) => d.extract({ path: outputDir, concurrency: 5 }))
}

async function displayFileTree(log: (message: string) => void, directory: string, depth = 0) {
  const files = await readdir(directory, { withFileTypes: true })
  for (const file of files) {
    if (file.isDirectory()) {
      log(`${'  '.repeat(depth) + file.name}/`)
      await displayFileTree(log, join(directory, file.name), depth + 1)
    } else {
      log(`${'  '.repeat(depth) + file.name}`)
    }
  }
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
    if ((!state.binaryPath || !state.codePath) && !state.mlflowPath) {
      throw new Error('Extract files requires a binary and code or mlflow path')
    }

    // extract bundles
    this.logger.info({ ...state }, 'Extracting zip bundles')

    // TODO: is there a better way to do this?
    let filesToUnzip: string[] = []
    if (state.binaryPath) {
      filesToUnzip.push(state.binaryPath)
    }
    if (state.codePath) {
      filesToUnzip.push(state.codePath)
    }
    if (state.mlflowPath) {
      filesToUnzip.push(state.mlflowPath)
    }

    let unzips: Promise<void>[] = []
    for (const file of filesToUnzip) {
      unzips.push(unzipFile(file))
    }
    await Promise.all(unzips)

    // delete old bundles
    this.logger.info({ ...state }, 'Removing zip bundles')
    rm(...filesToUnzip)

    this.logger.info({}, '== Directory Tree')
    this.logger.info({}, 'model/')
    await displayFileTree((message: string) => this.logger.info({}, message), state.workingDirectory, 1)
  }

  async rollback(_version: VersionDoc, _files: Files, _state: any): Promise<void> {
    // nothing to do
  }
}

export default function extractFiles(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new ExtractFiles(logger, opts)
}
