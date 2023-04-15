import { Validator } from 'jsonschema'

import logger from './logger.js'

const validator = new Validator()

export function validateSchema(data: any, schema: any) {
  const props = Object.keys(schema.properties).filter((key) =>
    ['object', 'array'].includes(schema.properties[key].type)
  )

  const schemaSteps = props.map((prop: any) => ({
    schema: {
      definitions: schema.definitions,
      ...schema.properties[prop],
    },
    stepName: prop,
  }))

  for (const step of schemaSteps) {
    const result = validator.validate(data[step.stepName], step.schema)
    if (!result.valid) {
      logger.error({ stepName: step.stepName }, 'failed to validate in section', step.stepName)
      return result.errors
    }
  }

  return null
}
