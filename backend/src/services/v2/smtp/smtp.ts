import nodemailer, { Transporter } from 'nodemailer'

import authorisation from '../../../connectors/v2/authorisation/index.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewRequestDoc } from '../../../models/v2/ReviewRequest.js'
import config from '../../../utils/v2/config.js'
import { EntityKind, fromEntity } from '../../../utils/v2/entity.js'
import { GenericError } from '../../../utils/v2/error.js'
import log from '../log.js'
import { ReleaseReviewRequestEmail } from './templates/releaseReviewRequest.js'
import { IEmailTemplate } from './templates/baseEmailTemplate.js'
import { emailDeploymentOwnersOnVersionDeletion } from '../../deployment.js'
import { getReleaseName } from '../release.js'

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
let transporter: undefined | Transporter = undefined

export async function requestReviewForRelease(entity: string, reviewRequest: ReviewRequestDoc, release: ReleaseDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const entityKind = fromEntity(entity).kind
  let to: string
  if (entityKind === EntityKind.User) {
    to = (await authorisation.getUserInformation(entity)).email
  } else if (entityKind === EntityKind.Group) {
    const groupMembers = await authorisation.getGroupMembers(entity)
    groupMembers.forEach((groupMember) => requestReviewForRelease(groupMember, reviewRequest, release))
    return
  } else {
    throw GenericError(500, 'Error Sending email notification to unrecognised entity', { entity })
  }

  const releaseName = getReleaseName(release)
  const email = new ReleaseReviewRequestEmail()
  email.setTo(to)
  email.setSubject(releaseName)
  email.setText(releaseName, reviewRequest.kind, release.modelId, appBaseUrl, release.createdBy)
  email.setHtml(releaseName, reviewRequest.kind, release.modelId, appBaseUrl, release.createdBy)
  await sendEmail(email)
}

async function sendEmail(email: IEmailTemplate) {
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
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (err) {
    throw GenericError(500, 'Error Sending email notification', { to: email.to, text: email.text, internal: err })
  }
}
