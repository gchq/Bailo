import { MongoServerError } from 'mongodb'
import { HydratedDocument, isValidObjectId } from 'mongoose'

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

export function isHydratedMongoDoc<T>(value: unknown): value is HydratedDocument<T> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const doc = value as any

  return (
    typeof doc.$isNew === 'boolean' &&
    typeof doc.$get === 'function' &&
    typeof doc.toObject === 'function' &&
    isValidObjectId(doc._id)
  )
}

export function handleDuplicateKeys(error: unknown) {
  if (isMongoServerError(error) && error.code === 11000) {
    throw BadReq(`The following is not unique: ${JSON.stringify(error.keyValue)}`)
  }
}
