import config from 'config'
import dedent from 'dedent-js'
import mjml2html from 'mjml'
import { DeploymentDoc } from '../models/Deployment.js'
import { ModelDoc } from '../models/Model.js'
import { ApprovalCategory } from '../models/Approval.js'
import { VersionDoc } from '../models/Version.js'
import createRequestUrl from '../utils/createRequestUrl.js'
import { wrapper } from './partials.js'

export interface ReviewedApprovalContext {
  document: VersionDoc | DeploymentDoc
  choice: string
  approvalCategory: ApprovalCategory
  reviewingUser: string
}

export function html({ document, approvalCategory, choice, reviewingUser }: ReviewedApprovalContext) {
  const model = document.model as ModelDoc
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const requestUrl = createRequestUrl(model, document, base)

  return mjml2html(
    wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">Your ${approvalCategory.toLowerCase()} request has been reviewed by ${reviewingUser}.</span>
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
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Approval Category</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${approvalCategory}</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Response</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${choice}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      <mj-column width="100%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${requestUrl}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Open ${approvalCategory}</mj-button>
      </mj-column>
    </mj-section>
  `)
  ).html
}

export function text({ document, approvalCategory, choice }: ReviewedApprovalContext) {
  const model = document.model as ModelDoc
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const requestUrl = createRequestUrl(model, document, base)

  return dedent(`
    '${model.currentMetadata.highLevelDetails.name}' has been reviewed

    Approval Category: '${approvalCategory}'
    Response: '${choice}'

    Open ${approvalCategory}: ${requestUrl}
  `)
}

export function subject({ document }: ReviewedApprovalContext) {
  const model = document.model as ModelDoc

  return dedent(`
    '${model.currentMetadata.highLevelDetails.name}' has been reviewed
  `)
}

export function reviewedApproval(context: ReviewedApprovalContext) {
  return {
    html: html(context),
    text: text(context),
    subject: subject(context),
  }
}
