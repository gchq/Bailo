import { NextFunction, Request, Response } from 'express'
import { TLSSocket } from 'tls'

import { UserInterface } from '../../models/User.js'
import { Unauthorized } from '../../utils/error.js'

export function internalServiceAuth(req: Request, _res: Response, next: NextFunction) {
  const socket = req.socket as TLSSocket
  const cert = socket.getPeerCertificate?.()
  if (!socket.authorized || !cert || !cert.subject) {
    throw Unauthorized('Valid client certificate required')
  }

  // mark the request as internal system user
  req.user = {
    dn: cert.subject.CN ?? 'internal-service',
    internal: true,
    certSubject: JSON.stringify(cert.subject),
  } as UserInterface

  return next()
}
