import dedent from 'dedent-js'

import { ReviewKindKeys } from '../../../../types/v2/enums.js'

export interface IEmailTemplate {
  getSubject(resourceName: string): string
  getHtml(releaseName: string, reviewKind: ReviewKindKeys, modelId: string, baseUrl: string, email: string): string
  getBody(releaseName: string, reviewKind: ReviewKindKeys, baseUrl: string, modelId)
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
