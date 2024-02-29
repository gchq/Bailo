import { Options, Schema, ValidationError } from 'jsonschema'

/**
 * This has been added to jsonschema library, but not yet released
 */
export interface ValidatorResultError {
  instance: any
  schema: Schema
  options: Options
  errors: ValidationError
}

export function isValidatorResultError(err: unknown): err is ValidatorResultError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (err instanceof Error && err.name === 'Validation Error') {
    return true
  }

  return false
}
