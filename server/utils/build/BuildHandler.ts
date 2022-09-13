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
  }
  if (typeof e === 'string') {
    return e
  }
  return JSON.stringify(e)
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
    let state = {}

    buildLogger.info({ buildId }, `=== Building ${buildId}\n`)

    for (const [i, { construct, props }] of Object.entries(this.steps)) {
      const step: BuildStep = construct(buildLogger, props)
      const name = await step.name(version, files, state)
      const stepPrefix = `Step ${parseInt(i, 10) + 1}/${this.steps.length}`
      const stepStartTime = new Date()

      // Starting build step
      buildLogger.info({ step: i, name }, `${stepPrefix} : ${name}`)

      try {
        const newState = await step.build(version, files, state)
        if (newState) state = newState

        const time = prettyMs(new Date().getTime() - stepStartTime.getTime())
        buildLogger.info({ time }, `${stepPrefix} : Successfully completed in ${time}\n`)
      } catch (buildError) {
        // Handling error
        buildLogger.error({}, `${stepPrefix} : Failed due to error:`)
        buildLogger.error({}, indentString(formatError(buildError), 2))

        try {
          buildLogger.error({}, `${stepPrefix} : Rolling back`)
          const newState = await step.rollback(version, files, state)
          if (newState) state = newState
        } catch (rollbackError) {
          // Handling error during rollback
          buildLogger.error({}, `${stepPrefix} : Failed during rollback:`)
          buildLogger.error({}, indentString(formatError(rollbackError), 2))
        }

        buildLogger.error({}, `\nFailed to build model.\n\n`)
        throw buildError
      }
    }

    for (const [i, { construct, props }] of Object.entries(this.steps.reverse())) {
      const step: BuildStep = construct(buildLogger, props)
      const name = await step.name(version, files, state)
      const stepPrefix = `Tidy up Step ${parseInt(i, 10) + 1}/${this.steps.length}`
      const stepStartTime = new Date()

      // Starting build step
      buildLogger.info({ step: i, name }, `${stepPrefix} : ${name}`)

      try {
        const newState = await step.tidyUp(version, files, state)
        if (newState) state = newState

        const time = prettyMs(new Date().getTime() - stepStartTime.getTime())
        buildLogger.info({ time }, `${stepPrefix} : Successfully tidied up in ${time}\n`)
      } catch (e) {
        // Handling error
        buildLogger.error({}, `${stepPrefix} : Failed due to error:`)
        buildLogger.error({}, indentString(formatError(e), 2))

        buildLogger.error({}, `\nFailed to build model.\n\n`)
        throw e
      }
    }

    const time = prettyMs(new Date().getTime() - startTime.getTime())
    buildLogger.info({}, `Successfully completed build in ${time}`)
  }
}
