import mongoose, { Types } from 'mongoose'
import { ObjectId } from 'mongodb'
import { checkConnection } from '../utils/database'

export enum LogType {
  Build = 'build',
  Request = 'request',
  Misc = 'misc',
}

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
  levels: Array<number>
  types?: Array<LogType>
  search?: string
  regex: boolean
  buildId?: string
  reqId?: string
}
export async function getLogs({ after, before, levels, types, search, regex, buildId, reqId }: GetLogsArgs) {
  await checkConnection()

  const { db } = mongoose.connection
  const collection = db.collection('logs')

  let typeFilter = {}
  if (types) {
    typeFilter = {
      $or: transformTypeToMongoQuery(types),
    }
  }

  if (buildId) {
    typeFilter = {
      buildId,
    }
  }

  if (reqId) {
    typeFilter = {
      id: reqId,
    }
  }

  let searchFilter: any = {}
  if (search) {
    const match = regex ? { $regex: search } : { $regex: escapeRegExp(search) }
    searchFilter = {
      $or: [{ code: match }, { msg: match }],
    }

    if (!regex) {
      if (mongoose.isValidObjectId(search)) {
        const id = new ObjectId(search)
        searchFilter.$or.push({ _id: id })
      }
    }
  }

  return collection
    .find({
      time: { $gte: after, $lt: before },
      level: { $in: levels },
      ...typeFilter,
      ...searchFilter,
    })
    .limit(2000)
}
