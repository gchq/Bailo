import dedent from 'dedent-js'
import { Document } from 'mongoose'
import mjml2html from 'mjml'
import config from 'config'
import { wrapper } from './partials'
import { RequestType } from '../services/request'

export interface ReviewRequestContext {
  document: Document & { model: any; uuid: string }
  requestType: RequestType
}

export function html({ document, requestType }: ReviewRequestContext) {
  const { requester, uploader } = document.model.currentMetadata.contacts
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const requestUrl =
    requestType === 'Upload' ? `${base}/model/${document.model.uuid}` : `${base}/deployment/${document.uuid}`

  return mjml2html(
    wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">You have been requested to review a ${requestType.toLowerCase()}.</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#356cc7" padding-bottom="15px">
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Model Name</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${
          document.model.currentMetadata.highLevelDetails.name
        }</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Request Type</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${requestType}</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Uploader</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${
          uploader ?? requester
        }</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      <mj-column width="50%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${requestUrl}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Open ${requestType}</mj-button>
      </mj-column>
      <mj-column width="50%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${base}/review" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="12px">See Reviews</mj-button>
      </mj-column>
    </mj-section>
  `)
  ).html
}

export function text({ document, requestType }: ReviewRequestContext) {
  const { requester, uploader } = document.model.currentMetadata.contacts
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const requestUrl =
    requestType === 'Upload' ? `${base}/model/${document.model.uuid}` : `${base}/deployment/${document.uuid}`

  return dedent(`
    You have been requested to review '${document.model.currentMetadata.highLevelDetails.name}' on Bailo.

    RequestType: '${requestType}'
    Uploader: '${uploader ?? requester}'

    Open ${requestType}: ${requestUrl}
    See Reviews: ${base}/review
  `)
}

export function subject({ document }: ReviewRequestContext) {
  return dedent(`
    You have been requested to review '${document.model.currentMetadata.highLevelDetails.name}' on Bailo
  `)
}

export function reviewRequest(context: ReviewRequestContext) {
  return {
    html: html(context),
    text: text(context),
    subject: subject(context),
  }
}
