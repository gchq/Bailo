import dedent from 'dedent-js'
import { Document } from 'mongoose'
import mjml2html from 'mjml'
import config from 'config'
import { wrapper } from './partials.js'
import { VersionDoc } from '../models/Version.js'
import { DeploymentDoc } from '../models/Deployment.js'
import { RequestTypes } from '../models/Request.js'
import { ModelDoc } from '../models/Model.js'

export interface ReviewedRequestContext {
  document: VersionDoc | DeploymentDoc
  choice: string
  requestType: RequestTypes
}

export function html({ document, requestType, choice }: ReviewedRequestContext) {
  const model = document.model as ModelDoc
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const requestUrl = model.uuid
    ? `${base}/model/${model.uuid}`
    : 'uuid' in document
    ? `${base}/deployment/${document.uuid}`
    : ''

  return mjml2html(
    wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">Your ${requestType.toLowerCase()} request has been reviewed.</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#356cc7" padding-bottom="15px">
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Model Name</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${
          model.currentMetadata.highLevelDetails.name
        }</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Request Type</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${requestType}</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Response</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${choice}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      <mj-column width="100%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${requestUrl}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Open ${requestType}</mj-button>
      </mj-column>
    </mj-section>
  `)
  ).html
}

export function text({ document, requestType, choice }: ReviewedRequestContext) {
  const model = document.model as ModelDoc
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const requestUrl = model.uuid
    ? `${base}/model/${model.uuid}`
    : 'uuid' in document
    ? `${base}/deployment/${document.uuid}`
    : ''

  return dedent(`
    '${model.currentMetadata.highLevelDetails.name}' has been reviewed

    Request Type: '${requestType}'
    Response: '${choice}'

    Open ${requestType}: ${requestUrl}
  `)
}

export function subject({ document }: ReviewedRequestContext) {
  const model = document.model as ModelDoc

  return dedent(`
    '${model.currentMetadata.highLevelDetails.name}' has been reviewed
  `)
}

export function reviewedRequest(context: ReviewedRequestContext) {
  return {
    html: html(context),
    text: text(context),
    subject: subject(context),
  }
}
