import { MongoServerError } from 'mongodb'

import { BadReq } from './error.js'

export function isMongoServerError(err: unknown): err is MongoServerError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (err instanceof Error && err.name === 'MongoServerError') {
    return true
  }

  return false
}

export function handleDuplicateKeys(error: unknown) {
  if (isMongoServerError(error) && error.code === 11000) {
    throw BadReq(`The following is not unique: ${JSON.stringify(error.keyValue)}`)
  }
}
