import dedent from 'dedent-js'
import mjml2html from 'mjml'

export type emailContent = {
  subject: string
  text: string
  html: string
}

export type info = {
  title: string
  data: string
}

export type actions = {
  name: string
  url: string
}

export function buildEmail(title: string, metadata: info[], actions: actions[]): emailContent {
  return {
    subject: title,
    text: emailText(title, metadata, actions),
    html: emailHtml(title, metadata, actions),
  }
}

function emailText(title, reviewMetadata: info[], reviewActions: actions[]) {
  return dedent(`
    ${title}

    ${textMetadata(reviewMetadata)}

    ${textActions(reviewActions)}
  `)
}

function textMetadata(reviewMetadata: info[]) {
  return `${reviewMetadata.map((info) => `${info.title}: '${info.data}'\n`).join('')}`
}

function textActions(actionsList: actions[]) {
  return `${actionsList.map((action) => `${action.name}: '${action.url}'\n`).join('')}`
}

function emailHtml(title, reviewMetadata, reviewActions) {
  return mjml2html(
    wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">${title}</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#356cc7" padding-bottom="15px">
      ${htmlMetadata(reviewMetadata)}
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      ${htmlActions(reviewActions)}
    </mj-section>
  `),
  ).html
}

function htmlMetadata(reviewMetadata: info[]) {
  return `${reviewMetadata
    .map(
      (info) => `
      <mj-column>
        <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>${info.title}</strong></mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">${info.data}</mj-text>
      </mj-column>
  `,
    )
    .join('')}`
}

function htmlActions(actionsList: actions[]) {
  return `${actionsList
    .map(
      (action) => `
    <mj-column width="50%">
      <mj-button background-color="#f37f58" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${action.url}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">${action.name}</mj-button>
    </mj-column>
  `,
    )
    .join('')}`
}

function wrapper(children: string) {
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
