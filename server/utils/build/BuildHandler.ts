import indentString from 'indent-string'
import prettyMs from 'pretty-ms'
import { v4 as uuidv4 } from 'uuid'

import { VersionDoc } from '../../models/Version'
import logger from '../logger'
import { BuildLogger } from './BuildLogger'
import { BuildStep, Files } from './BuildStep'

type BuildConstructor = (logger: BuildLogger, props?: any) => BuildStep

function formatError(e: unknown): string {
  if (e instanceof Error) {
    return e.message
  } else if (typeof e === 'string') {
    return e
  } else {
    return JSON.stringify(e)
  }
}

export class BuildHandler {
  steps: { construct: BuildConstructor; props?: any }[]

  constructor(steps: { construct: BuildConstructor; props?: any }[]) {
    this.steps = steps
  }

  async process(version: VersionDoc, files: Files) {
    const startTime = new Date()
    const buildId = uuidv4()
    const vlog = logger.child({ versionId: version._id, buildId })
    const buildLogger = new BuildLogger(version, vlog)
    const state = {}

    buildLogger.info({ buildId }, `=== Building ${buildId}\n`)

    steps: for (const [i, { construct, props }] of Object.entries(this.steps)) {
      const step: BuildStep = construct(buildLogger, props)
      const name = await step.name(version, files, state)
      const stepPrefix = `Step ${parseInt(i) + 1}/${this.steps.length}`
      const stepStartTime = new Date()

      // Starting build step
      buildLogger.info({ step: i, name }, `${stepPrefix} : ${name}`)

      try {
        await step.build(version, files, state)

        const time = prettyMs(new Date().getTime() - stepStartTime.getTime())
        buildLogger.info({ time }, `${stepPrefix} : Succesfully completed in ${time}\n`)
      } catch (e) {
        // Handling error
        buildLogger.error({}, `${stepPrefix} : Failed due to error:`)
        buildLogger.error({}, indentString(formatError(e), 2))

        try {
          buildLogger.error({}, `${stepPrefix} : Rolling back`)
          await step.rollback(version, files, state)
        } catch (e) {
          // Handling error during rollback
          buildLogger.error({}, `${stepPrefix} : Failed during rollback:`)
          buildLogger.error({}, indentString(formatError(e), 2))
        }

        buildLogger.error({}, `\nFailed to build model.\n\n`)
        throw e
      }
    }

    steps: for (const [i, { construct, props }] of Object.entries(this.steps.reverse())) {
      const step: BuildStep = construct(buildLogger, props)
      const name = await step.name(version, files, state)
      const stepPrefix = `Tidyup Step ${parseInt(i) + 1}/${this.steps.length}`
      const stepStartTime = new Date()

      // Starting build step
      buildLogger.info({ step: i, name }, `${stepPrefix} : ${name}`)

      try {
        await step.tidyup(version, files, state)

        const time = prettyMs(new Date().getTime() - stepStartTime.getTime())
        buildLogger.info({ time }, `${stepPrefix} : Succesfully tidied up in ${time}\n`)
      } catch (e) {
        // Handling error
        buildLogger.error({}, `${stepPrefix} : Failed due to error:`)
        buildLogger.error({}, indentString(formatError(e), 2))

        buildLogger.error({}, `\nFailed to build model.\n\n`)
        throw e
      }
    }

    const time = prettyMs(new Date().getTime() - startTime.getTime())
    buildLogger.info({}, `Succesfully completed build in ${time}`)
  }
}
