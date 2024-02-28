import { ErrorInfo } from '../clients/registry.js'
import { BailoError } from './error.js'

export interface RegistryError extends BailoError {
  errors: Array<ErrorInfo>
}

export function isRegistryError(err: unknown): err is RegistryError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (err instanceof Error && err.name === 'Registry Error') {
    return true
  }

  return false
}
