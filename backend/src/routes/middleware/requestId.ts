import { createNamespace, getNamespace } from 'cls-hooked'
import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

export async function requestId(req: Request, res: Response, next: NextFunction) {
  req.reqId = (req.headers['x-request-id'] as string) || uuidv4()
  const session = createNamespace('my session')
  if (!session) {
    next()
  }
  session.bindEmitter(req)
  session.bindEmitter(res)
  session.run(() => {
    const ns = getNamespace('my session')
    if (ns) {
      ns.set('reqId', req.reqId)
    }
    next()
  })
}
