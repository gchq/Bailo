import dedent from 'dedent-js'
import mjml2html from 'mjml'

import { ReviewKindKeys } from '../../../../types/v2/enums.js'
import { BaseEmailTemplate, IEmailTemplate } from './baseEmailTemplate.js'

export class ReleaseReviewRequest extends BaseEmailTemplate implements IEmailTemplate {
  getSubject(resourceName: string): string {
    return dedent(`
    You have been requested to review '${resourceName}' on Bailo
  `)
  }

  getBody(releaseName: string, reviewKind: ReviewKindKeys, modelId: string, baseUrl: string, author: string) {
    // V2 change- we don't store the author of a release
    // TODO - Replace with URL to specific model release
    return dedent(`
    You have been requested to review '${releaseName}' on Bailo.

    Review Category: '${reviewKind}'
    Author: '${author}'

    Open ${reviewKind}: ${baseUrl}/model/${modelId}
    See Reviews: ${baseUrl}/review
  `)
  }

  getHtml(releaseName: string, reviewKind: ReviewKindKeys, modelId: string, baseUrl: string, author: string) {
    return mjml2html(
      super.wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">You have been requested to review a ${reviewKind.toLowerCase()}.</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#356cc7" padding-bottom="15px">
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Model Name</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${releaseName}</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Approval Category</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${reviewKind}</mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Author</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${author}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      <mj-column width="50%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${baseUrl}/model/${modelId}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Open ${reviewKind}</mj-button>
      </mj-column>
      <mj-column width="50%">
        <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${baseUrl}/review" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="12px">See Reviews</mj-button>
      </mj-column>
    </mj-section>
  `)
    ).html
  }
}
