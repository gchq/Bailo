import { NextFunction, Request, Response } from 'express'

import { UserInterface } from '../../models/User.js'
import { Unauthorized } from '../../utils/error.js'

/**
 * Internal authentication based on mutual TLS.
 *
 * Nginx terminates TLS and forwards the verified client cert.
 * Only internal services (ArtefactScan, registry, etc.) have valid certs.
 *
 * Nginx must be configured with:
 *   ssl_verify_client on;
 *   proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
 *   proxy_set_header X-SSL-Client-Subject $ssl_client_s_dn;
 */
export function internalServiceAuth(req: Request, _res: Response, next: NextFunction) {
  // Standard header when Nginx is configured with ssl_verify_client on;
  const verified = req.get('x-ssl-client-verify')
  const subject = req.get('x-ssl-client-subject')
  if (verified !== 'SUCCESS' || !subject) {
    throw Unauthorized('Internal endpoint - mTLS client certificate required')
  }

  // mark the request as internal system user
  req.user = {
    dn: 'internal-service',
    internal: true,
    certSubject: subject,
  } as UserInterface

  return next()
}
