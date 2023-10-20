import dedent from 'dedent-js'

import config from '../../../../utils/v2/config.js'

export abstract class BaseEmailTemplate {
  from = config.smtp.from
  subject = ''
  text = ''
  html = ''
  to = ''

  abstract setTo(emailAddress: string)
  abstract setSubject(resourceName: string, reviewerRole: string)
  abstract setHtml(releaseName: string, modelId: string, baseUrl: string, author: string)
  abstract setText(releaseName: string, modelId: string, baseUrl: string, author: string)

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
