import dedent from 'dedent-js'
import mjml2html from 'mjml'

import { ReviewKind } from '../../../../types/v2/enums.js'
import { BaseEmailTemplate } from './baseEmailTemplate.js'

export class ReleaseReviewEmail extends BaseEmailTemplate {
  setTo(emailAddress: string) {
    this.to = emailAddress
  }

  setSubject(resourceName: string, reviewerRole: string) {
    this.subject = dedent(`
    ${reviewerRole.toUpperCase()}: You have been requested to review '${resourceName}' on Bailo
  `)
  }

  setText(releaseName: string, modelId: string, baseUrl: string, author: string) {
    // V2 change- we don't store the author of a release
    // TODO - Replace with URL to specific model release
    this.text = dedent(`
    You have been requested to review '${releaseName}' on Bailo.

    Review Category: '${ReviewKind.Release}'
    Author: '${author}'

    Open ${ReviewKind.Release}: ${baseUrl}/model/${modelId}
    See Reviews: ${baseUrl}/review
  `)
  }

  setHtml(releaseName: string, modelId: string, baseUrl: string, author: string) {
    this.html = mjml2html(`
    <mjml>
      <mj-head>
        <mj-style>
          .diagonal {
          top: 0;
          bottom: 0;
          right: 0;
          left: 0;
          width: 100%;
          height: 50px;
          background-color: #f0f0f0;
          z-index: 0;
          transform: skewY(2deg);
          transform-origin: top right;
          height: 12px;
          }
          .gradient-bg {
          background: linear-gradient(276deg, rgba(214,37,96) 0%, rgba(84,39,142) 100%);
          }
          .gradient-bg-border {
          background: linear-gradient(276deg, rgba(209,73,118) 0%, rgba(126,66,204) 100%);
          height: 12px;
          }
          .text {
          height: 12px;
          }
        </mj-style>
      </mj-head>
      <mj-body>
        <mj-wrapper background-color="#9e60f2" padding-bottom="0px" padding-top="0px">
          <mj-section padding-bottom="5px" css-class='gradient-bg'>
            <mj-column width="100%">
              <mj-text css-class='text' align="center" font-weight="bold" color="#FFF" font-size="25px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px" padding-top="10px">Bailo
              </mj-text>
            </mj-column>
          </mj-section>
          <mj-section padding-bottom="5px" css-class='gradient-bg'>
            <mj-column width="100%">
              <mj-text align="center" color="#FFF" font-size="20px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="30px" padding-top="10px">You have been requested to review a <span style="font-weight:bold">${ReviewKind.Release.toLowerCase()}.</span>
              </mj-text>
            </mj-column>
          </mj-section>
          <mj-section css-class='diagonal gradient-bg'>
          </mj-section>
          <mj-section css-class='diagonal gradient-bg-border'>
          </mj-section>
          <mj-section background-color="#9e60f2" padding-bottom="15px">
            <mj-column>
              <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Model Name</strong></mj-text>
              <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${releaseName}</mj-text>
            </mj-column>
            <mj-column>
              <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Review Category</strong></mj-text>
              <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${
                ReviewKind.Release
              }</mj-text>
            </mj-column>
            <mj-column>
              <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Author</strong></mj-text>
              <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${author}</mj-text>
            </mj-column>
          </mj-section>
          <mj-section background-color="#54278e" padding-bottom="20px" padding-top="20px">
            <mj-column width="50%">
              <mj-button background-color="#54278e" border="solid 2px white" color="#FFF" font-size="14px" align="center" font-weight="bold" padding="15px 30px" border-radius="5px" href="${baseUrl}/model/${modelId}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Open ${
                ReviewKind.Release
              }</mj-button>
            </mj-column>
            <mj-column width="50%">
              <mj-button background-color="#54278e" border="solid 2px white" color="#FFF" font-size="14px" align="center" font-weight="bold" padding="15px 30px" border-radius="5px" href="${baseUrl}/review" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="12px">See Reviews</mj-button>
            </mj-column>
          </mj-section>
        </mj-wrapper>
      </mj-body>
    </mjml>
  `).html
  }
}
