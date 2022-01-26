// import Ajv from 'ajv'
import { Validator } from 'jsonschema'
import logger from './logger'

const validator = new Validator()

// import addFormats from 'ajv-formats'
// const ajv = new Ajv({ strict: false })
// addFormats(ajv)

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

  // this compilation is cached, so will only run once per schema
  // const validate = ajv.compile(schema)

  // const valid = validate(data)

  // if (!valid) return validate.errors

  // const result = validator.validate(data, schema)
  // if (!result.valid) return result.errors

  // return null
}
