import dedent from 'dedent-js'

import { ReviewKindKeys } from '../../../../types/v2/enums.js'

export interface IEmailTemplate {
  to: string
  setTo(emailAddress: string)
  subject: string
  setSubject(resourceName: string, reviewerRole: string)
  html: string
  setHtml(releaseName: string, reviewKind: ReviewKindKeys, modelId: string, baseUrl: string, author: string)
  text: string
  setText(releaseName: string, reviewKind: ReviewKindKeys, modelId: string, baseUrl: string, author: string)
}

export abstract class BaseEmailTemplate {
  wrapper(children: string) {
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
}
