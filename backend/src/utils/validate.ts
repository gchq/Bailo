import { type Request } from 'express'

import { z } from '../lib/zod.js'
import { BadReq } from './error.js'

export function parse<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  try {
    return schema.parse(req)
  } catch (err) {
    const error = err as z.ZodError
    throw BadReq(formatZodIssues(error.issues), { errors: error.issues })
  }
}

/** Formats issues as `Path: a.b[0].c - Message: <message>`, separated by ` | `. */
export function formatZodIssues(issues: z.core.$ZodIssue[]) {
  return issues.map((issue) => `Path: ${formatZodPath(issue.path)} - Message: ${issue.message}`).join(' | ')
}

function formatZodPath(path: z.core.$ZodIssue['path']) {
  return path.reduce<string>((result, key) => {
    if (typeof key === 'number') {
      return `${result}[${key}]`
    }
    return [result, String(key)].filter(Boolean).join('.')
  }, '')
}

export function coerceArray<T extends z.ZodType>(object: z.ZodArray<T>) {
  return z.preprocess((val) => {
    if (val === '' || val === undefined) {
      return undefined
    }
    return Array.isArray(val) ? val : [val]
  }, object)
}

export function strictCoerceBoolean(object: z.ZodBoolean) {
  return z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), object)
}
