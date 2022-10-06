import { exec } from 'shelljs'
import config from 'config'

import logger from '../logger'
import { BuildLogger } from './BuildLogger'

export async function pullBuilderImage() {
  if (config.get('build.environment') === 'openshift') {
    logger.info('Running in Openshift, so not pulling base image')
    return
  }

  await runCommand(
    `img pull ${config.get('s2i.builderImage')}`,
    (data: string) => data.split(/\r?\n/).map((msg: string) => logger.info({}, msg)),
    (data: string) => data.split(/\r?\n/).map((msg: string) => logger.error({}, msg))
  )
}

export interface FileRef {
  path: string
  bucket: string
  name: string
}

export function logCommand(command: string, buildLogger: BuildLogger) {
  return runCommand(
    command,
    (data: string) => data.split(/\r?\n/).map((msg: string) => buildLogger.info({}, msg)),
    (data: string) => data.split(/\r?\n/).map((msg: string) => buildLogger.error({}, msg))
  )
}

type RunCommandOptions = {
  silentErrors?: boolean
  hide?: boolean
}

export async function runCommand(
  command: string,
  onStdout: (data: string) => void,
  onStderr: (data: string) => void,
  opts: RunCommandOptions = {}
) {
  const childProcess = exec(command, { async: true, silent: true })
  childProcess.stdout?.on('data', (data) => {
    onStdout(data.trim())
  })

  childProcess.stderr?.on('data', (data) => {
    onStderr(data.trim())
  })

  await new Promise((resolve, reject) => {
    childProcess.on('exit', () => {
      if (childProcess.exitCode !== 0 && !opts.silentErrors) {
        reject(
          new Error(
            `Failed with status code '${childProcess.exitCode}'${opts.hide ? '' : ` when running '${command}'`}`
          )
        )
        return
      }

      resolve({})
    })
  })
}
