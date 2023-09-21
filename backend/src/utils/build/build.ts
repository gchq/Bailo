import { execaCommand } from 'execa'

import config from '../config.js'
import logger from '../logger.js'
import { BuildLogger } from './BuildLogger.js'

export async function pullBuilderImage() {
  if (config.build.environment === 'openshift') {
    logger.info('Running in Openshift, so not pulling base image')
    return
  }

  await runCommand(
    `img pull ${config.ui.seldonVersions[0].image}`,
    (data: string) => data.split(/\r?\\?\n/).map((msg: string) => logger.info({}, msg)),
    (data: string) => data.split(/\r?\\?\n/).map((msg: string) => logger.error({}, msg)),
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
    (data: string) => data.split(/(\r?\n)|(\\n)/g).map((msg: string) => buildLogger.info({}, msg)),
    (data: string) => data.split(/(\r?\n)|(\\n)/g).map((msg: string) => buildLogger.error({}, msg)),
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
  opts: RunCommandOptions = {},
) {
  const childProcess = execaCommand(command)
  childProcess.stdout?.on('data', (data) => {
    data
      .toString('utf-8')
      .split(/(\r?\n)|(\\n)/g)
      .filter((msg) => msg && msg !== '\\n' && msg !== '\n')
      .forEach((msg: string) => onStdout(msg))
  })

  childProcess.stderr?.on('data', (data) => {
    data
      .toString('utf-8')
      .split(/(\r?\n)|(\\n)/g)
      .filter((msg) => msg && msg !== '\\n' && msg !== '\n')
      .forEach((msg: string) => onStderr(msg))
  })

  await new Promise((resolve, reject) => {
    childProcess.on('exit', () => {
      if (childProcess.exitCode !== 0 && !opts.silentErrors) {
        reject(
          new Error(
            `Failed with status code '${childProcess.exitCode}'${opts.hide ? '' : ` when running '${command}'`}`,
          ),
        )
        return
      }

      resolve({})
    })
  })
}
