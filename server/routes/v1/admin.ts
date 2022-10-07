import { Request, Response } from 'express'
import QueryString from 'qs'
import { getLogs, getLogType, LogType } from '../../services/logs'
import { BadReq } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'

function parseDateQuery(
  queryDate: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
  fallback: Date
): Date {
  if (typeof queryDate !== 'string') {
    return fallback
  }

  const date = Date.parse(queryDate)

  if (Number.isNaN(date)) {
    return fallback
  }

  return new Date(date)
}

function queryStringArrayTypeGuard(query: any): query is QueryString.ParsedQs[] {
  return Array.isArray(query) && typeof query[0] === 'object'
}

function parseQueryArray(
  property: string,
  query: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined
): string[] {
  if (!query) {
    return []
  }

  if ((!Array.isArray(query) && typeof query !== 'string') || queryStringArrayTypeGuard(query)) {
    throw BadReq({ [property]: query }, `Should not pass an object to ${property}`)
  }

  if (!Array.isArray(query)) {
    return [query]
  }

  return query
}

function parseString(
  property: string,
  query: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined
): string {
  if (typeof query !== 'string') {
    throw BadReq({ [property]: query }, `Must pass a string to ${property}`)
  }

  return query
}

const isLogType = (item: LogType | undefined): item is LogType => !!item

export const getApplicationLogs = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const after = parseDateQuery(req.query.after, new Date(0))
    const before = parseDateQuery(req.query.before, new Date(Date.now()))

    const filter = parseQueryArray('filter', req.query.filter)

    const levels = filter.map((value) => parseInt(value, 10)).filter((value) => !Number.isNaN(value))
    const types = filter.map((value) => getLogType(value)).filter(isLogType)

    if (levels.length === 0) {
      throw BadReq({ levels }, 'Error, provided no valid log levels')
    }

    if (types.length === 0) {
      throw BadReq({ types }, 'Error, provided no valid types')
    }

    const search = parseString('search', req.query.search)

    const regex = req.query.regex === 'true'

    const logs = await getLogs({ after, before, levels, types, search, regex })

    res.json({
      logs: await logs.toArray(),
    })
  },
]
