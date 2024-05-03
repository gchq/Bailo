import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

export async function requestId(req: Request, res: Response, next: NextFunction) {
  req.reqId = (req.headers['x-request-id'] as string) || uuidv4()

  next()
}
