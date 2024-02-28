import { Request } from 'express'
import z, { ZodError, ZodSchema } from 'zod'
import { ErrorMessageOptions, generateErrorMessage } from 'zod-error'

import { BadReq } from './error.js'

export function parse<T extends ZodSchema>(req: Request, schema: T): z.infer<T> {
  try {
    return schema.parse(req)
  } catch (err) {
    const error = err as ZodError
    const options: ErrorMessageOptions = {
      delimiter: {
        component: ' - ',
      },
      code: {
        enabled: false,
      },
    }
    throw BadReq(generateErrorMessage(error.issues, options), { errors: error.issues })
  }
}

export function coerceArray(object: z.ZodTypeAny) {
  return z.preprocess((val) => {
    if (val === '' || val === undefined) return undefined
    return Array.isArray(val) ? val : [val]
  }, object)
}

export function strictCoerceBoolean(object: z.ZodTypeAny) {
  return z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : undefined), object)
}
