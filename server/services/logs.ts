import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'
import { connectToMongoose } from '../utils/database'
import { LogType } from '../../types/interfaces'

export function getLogType(type: string): LogType | undefined {
  switch (type) {
    case 'build':
      return LogType.Build
    case 'request':
      return LogType.Request
    case 'misc':
      return LogType.Misc
    default:
      return undefined
  }
}

function transformTypeToMongoQuery(types: Array<LogType>) {
  const typeFilter: Array<unknown> = []

  let exhaustiveCheck: never
  for (const type of types) {
    switch (type) {
      case LogType.Build:
        typeFilter.push({ code: 'starting_model_build' })
        break
      case LogType.Request:
        typeFilter.push({ code: 'request' })
        break
      case LogType.Misc:
        typeFilter.push({
          buildId: { $exists: false },
          id: { $exists: false },
        })
        break
      default:
        exhaustiveCheck = type
        throw new Error(`Unhandled color case: ${exhaustiveCheck}`)
    }
  }

  return typeFilter
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface GetLogsArgs {
  after: Date
  before: Date
  level: number
  types?: Array<LogType>
  search?: string
  isRegex: boolean
  buildId?: string
  requestId?: string
}
export async function getLogs({ after, before, level, types, search, isRegex, buildId, requestId }: GetLogsArgs) {
  await connectToMongoose()

  const { db } = mongoose.connection
  const collection = db.collection('logs')

  let typeFilter = {}
  if (types && !search) {
    typeFilter = {
      $or: transformTypeToMongoQuery(types),
    }
  }

  if (buildId) {
    typeFilter = {
      buildId,
    }
  }

  if (requestId) {
    typeFilter = {
      id: requestId,
    }
  }

  let searchFilter: any = {}
  if (search) {
    const match = isRegex ? { $regex: search } : { $regex: escapeRegExp(search) }
    searchFilter = {
      $or: [{ code: match }, { msg: match }],
    }

    if (!isRegex) {
      if (mongoose.isValidObjectId(search)) {
        const id = new ObjectId(search)
        searchFilter.$or.push({ _id: id })
      }
    }
  }

  return collection
    .find({
      time: { $gte: after, $lt: before },
      level: { $gte: level },
      ...typeFilter,
      ...searchFilter,
    })
    .sort({ time: -1 })
    .limit(500)
}
