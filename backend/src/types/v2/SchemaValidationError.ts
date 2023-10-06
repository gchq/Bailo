import { ValidationError } from 'jsonschema'

export class SchemaValidationError extends Error {
  stepName: string
  validationErrors: ValidationError[]
  constructor(step: string, errors: ValidationError[]) {
    super('The data failed to validate against the schema provided')
    this.stepName = step
    this.validationErrors = errors
  }
}

export function isSchemaValidationError(err: unknown): err is SchemaValidationError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (err instanceof SchemaValidationError) {
    return true
  }

  return false
}
