import { NextFunction, Request, Response } from 'express'
import z, { AnyZodObject, ZodError } from 'zod'

import { BadReq } from '../utils/v2/error.js'

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      return next()
    } catch (err: unknown) {
      const error = err as ZodError
      throw BadReq(error.issues[0].message, { errors: error.issues })
    }
  }
}

export function parse<T extends AnyZodObject>(req: Request, schema: T): z.infer<T> {
  try {
    return schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    })
  } catch (err) {
    const error = err as ZodError

    console.log(JSON.stringify(error, null, 4))

    throw BadReq(error.issues[0].message, { errors: error.issues })
  }
}
