import nodemailer, { Transporter } from 'nodemailer'

import authorisation from '../../../connectors/v2/authorisation/index.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewRequestDoc } from '../../../models/v2/ReviewRequest.js'
import config from '../../../utils/v2/config.js'
import { EntityKind, fromEntity } from '../../../utils/v2/entity.js'
import { GenericError } from '../../../utils/v2/error.js'
import log from '../log.js'
import { ReleaseReviewRequest } from './templates/releaseReviewRequest.js'

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
let transporter: undefined | Transporter = undefined

export async function sendEmail(entity: string, reviewRequest: ReviewRequestDoc, release: ReleaseDoc) {
  const entityKind = fromEntity(entity).kind
  let to: string
  if (entityKind === EntityKind.User) {
    to = (await authorisation.getUserInformation(entity)).email
  } else if (entityKind === EntityKind.Group) {
    const groupMembers = await authorisation.getGroupMembers(entity)
    groupMembers.forEach((groupMember) => sendEmail(groupMember, reviewRequest, release))
    return
  } else {
    throw GenericError(500, 'Error Sending email notification to unrecognised entity', { entity })
  }

  const email = new ReleaseReviewRequest()
  const subject = email.getSubject(release.name)
  const text = email.getBody(release.name, reviewRequest.kind, release.modelId, appBaseUrl, 'unknown')
  const html = email.getHtml(release.name, reviewRequest.kind, release.modelId, appBaseUrl, 'unknown')

  if (!config.smtp.enabled) {
    log.info({ subject, to }, 'Not sending email due to SMTP disabled')
    return
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.connection.host,
      port: config.smtp.connection.port,
      secure: config.smtp.connection.secure,
      auth: config.smtp.connection.auth,
      tls: config.smtp.connection.tls,
    })
  }

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from, // sender address
      to,
      subject,
      text,
      html,
    })
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (err) {
    throw GenericError(500, 'Error Sending email notification', { to, text, internal: err })
  }
}
