import mongoose from 'mongoose'
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

interface GetLogsArgs {
  after: Date
  before: Date
  levels: Array<number>
  types: Array<LogType>
  search: string
  regex: boolean
}
export async function getLogs({ after, before, levels, types, search, regex }: GetLogsArgs) {
  await checkConnection()

  const { db } = mongoose.connection
  const collection = db.collection('logs')

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

  return collection
    .find({
      time: { $gte: after, $lt: before },
      level: { $in: levels },
      $or: typeFilter,
    })
    .limit(2000)
}
