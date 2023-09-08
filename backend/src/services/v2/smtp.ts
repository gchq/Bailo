import dedent from 'dedent-js'
import mjml2html from 'mjml'
import nodemailer, { Transporter } from 'nodemailer'

import authorisation from '../../connectors/v2/authorisation/index.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import { ReviewRequestDoc } from '../../models/v2/ReviewRequest.js'
import config from '../../utils/v2/config.js'
import { EntityKind, fromEntity } from '../../utils/v2/entity.js'
import { GenericError } from '../../utils/v2/error.js'
import log from './log.js'

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
let transporter: undefined | Transporter = undefined

export async function sendEmail(entity: string, approval: ReviewRequestDoc, release: ReleaseDoc) {
  let to: string
  if (fromEntity(entity).kind === EntityKind.User) {
    to = (await authorisation.getUserInformation(entity)).email
  } else if (fromEntity(entity).kind === EntityKind.Group) {
    ;(await authorisation.getGroupMembers(entity)).forEach((groupMember) => sendEmail(groupMember, approval, release))
    return
  } else {
    throw GenericError(500, 'Error Sending email notification to unrecognised entity', { entity })
  }

  const subject = await getSubject(release)
  const text = await getBody(approval, release)
  const html = await getHtml(to, approval, release)

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

async function getSubject(release: ReleaseDoc) {
  return dedent(`
    You have been requested to review '${release.name}' on Bailo
  `)
}

async function getBody(approval: ReviewRequestDoc, release: ReleaseDoc) {
  // V2 change- we don't store the author of a release
  // TODO - Replace with URL to specific model release
  return dedent(`
    You have been requested to review '${release.name}' on Bailo.

    Approval Category: '${approval.kind}'
    Author: 'unknown'

    Open ${approval.kind}: ${appBaseUrl}/model/${release.modelId}
    See Reviews: ${appBaseUrl}/review
  `)
}

export async function getHtml(email: string, approval: ReviewRequestDoc, release: ReleaseDoc) {
  return mjml2html(
    wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">You have been requested to review a ${approval.kind.toLowerCase()}.</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#356cc7" padding-bottom="15px">
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Model Name</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${
          release.name
        }</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Approval Category</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${
          approval.kind
        }</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Uploader</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${email}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      <mj-column width="50%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${appBaseUrl}/model/${
      release.modelId
    }" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Open ${
      approval.kind
    }</mj-button>
      </mj-column>
      <mj-column width="50%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${appBaseUrl}/review" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="12px">See Reviews</mj-button>
      </mj-column>
    </mj-section>
  `)
  ).html
}

export function wrapper(children: string) {
  return dedent(`
    <mjml>
      <mj-body background-color="#ccd3e0">
        <mj-section background-color="#ccd3e0" padding-bottom="20px" padding-top="20px">
        </mj-section>
        ${children}
      </mj-body>
    </mjml>
  `)
}
