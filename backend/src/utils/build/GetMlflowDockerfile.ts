/* eslint-disable no-param-reassign */
import dedent from 'dedent-js'
import { writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import shelljs from 'shelljs'
import { v4 as uuidv4 } from 'uuid'

import { VersionDoc } from '../../types/types.js'
import config from '../config.js'
import { logCommand } from './build.js'
import { BuildLogger } from './BuildLogger.js'
import { BuildOpts, BuildStep, Files } from './BuildStep.js'

const { rm, mkdir } = shelljs

interface GetMlflowDockerfileProps {
  mlflowDockerfile: string
}

class GetMlflowDockerfile extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props: GetMlflowDockerfileProps) {
    super(logger, opts, props)

    this.opts.retryable = true
  }

  async name() {
    return 'Get Mlflow Dockerfile'
  }

  async build(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (!state.workingDirectory) {
      throw new Error('Get dockerfile requires a working directory')
    }

    this.logger.info({}, 'Generate build folder')
    const buildDir = state.workingDirectory
    state.buildDir = buildDir

    // generate model-settings.json
    // this sets the v2 api model path
    const modelName = 'model'
    const modelSettings = `{
      "name": "${modelName}",
      "implementation": "mlserver_mlflow.MLflowRuntime",
      "parameters": {
        "uri": "."
      }
    }`

    // Todo: get python version from MLmodel files
    const pythonVersion = '3.10'
    // Todo: get from MLmodel file
    const mlflowVersion = '2.3'
    const mlserverVersion = '1.3.2'

    // Need to configure pip conf
    // Is there a s2i for mlserver - no
    const dockerfile = `FROM python:${pythonVersion}-slim
    RUN pip install mlflow==${mlflowVersion} mlserver==${mlserverVersion} mlserver-mlflow==${mlserverVersion}
    WORKDIR model
    COPY . .
    RUN pip install --no-cache-dir -r ./requirements.txt
    CMD ["mlserver", "start", "."]
    `

    writeFile(`${buildDir}/model-settings.json`, modelSettings)
    writeFile(`${buildDir}/Dockerfile`, dockerfile)

    state.dockerfilePath = join(buildDir, 'Dockerfile')
  }

  async rollback(_version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (state.workingDirectory) {
      rm('-rf', join(state.workingDirectory, '.s2i'))
    }

    if (state.buildDir) {
      rm('-rf', state.buildDir)
    }
  }

  async tidyUp(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function getSeldonDockerfile(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger, props: GetMlflowDockerfileProps) => new GetMlflowDockerfile(logger, opts, props)
}
