import { MongoServerError } from 'mongodb'

export function isMongoServerError(err: unknown): err is MongoServerError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (err instanceof Error && err.name === 'MongoServerError') {
    return true
  }

  return false
}
