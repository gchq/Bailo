import { Request } from 'express'
import z, { AnyZodObject, ZodError } from 'zod'

import { BadReq } from './v2/error.js'

export function parse<T extends AnyZodObject>(req: Request, schema: T): z.infer<T> {
  try {
    return schema.parse(req)
  } catch (err) {
    const error = err as ZodError
    throw BadReq(error.issues[0].message, { errors: error.issues })
  }
}
