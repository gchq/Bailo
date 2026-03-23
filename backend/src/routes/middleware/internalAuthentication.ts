import { NextFunction, Request, Response } from 'express'
import { TLSSocket } from 'tls'

import { UserInterface } from '../../models/User.js'
import config from '../../utils/config.js'
import { Unauthorized } from '../../utils/error.js'

export function internalServiceAuth(req: Request, _res: Response, next: NextFunction) {
  const socket = req.socket as TLSSocket
  if (!socket.authorized) {
    throw Unauthorized('Client certificate not authorised by CA')
  }
  const cert = socket.getPeerCertificate?.()
  if (!cert || !cert.subject || !cert.subject.CN) {
    throw Unauthorized('Client certificate missing subject CN')
  }

  if (Array.isArray(cert.subject.CN)) {
    throw Unauthorized('Multiple CNs in certificate are not permitted')
  }
  const cn = cert.subject.CN
  if (!config.app.internalAuth.allowedClientCNs.includes(cn)) {
    throw Unauthorized(`Client certificate CN not permitted: ${cn}`)
  }

  // mark the request as internal system user
  req.user = {
    dn: cn,
    internal: true,
    certSubject: JSON.stringify(cert.subject),
  } as UserInterface

  return next()
}
