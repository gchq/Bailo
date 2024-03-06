import dedent from 'dedent-js'
import mjml2html from 'mjml'

export type EmailContent = {
  subject: string
  text: string
  html: string
}

export type Info = {
  title: string
  data: string
}

export type actions = {
  name: string
  url: string
}

export function buildEmail(title: string, metadata: Info[], actions: actions[]): EmailContent {
  return {
    subject: title,
    text: emailText(title, metadata, actions),
    html: emailHtml(title, metadata, actions),
  }
}

function emailText(title, reviewMetadata: Info[], reviewActions: actions[]) {
  return dedent(`
    ${title}

    ${textMetadata(reviewMetadata)}

    ${textActions(reviewActions)}
  `)
}

function textMetadata(reviewMetadata: Info[]) {
  return `${reviewMetadata.map((info) => `${info.title}: '${info.data}'\n`).join('')}`
}

function textActions(actionsList: actions[]) {
  return `${actionsList.map((action) => `${action.name}: '${action.url}'\n`).join('')}`
}

function emailHtml(title, reviewMetadata, reviewActions) {
  return mjml2html(
    wrapper(`
    <mj-section padding-bottom="5px" css-class='gradient-bg' padding-bottom="5px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">Bailo</span>
        </mj-text>
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">${title}</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section css-class='diagonal gradient-bg'>
    </mj-section>
    <mj-section css-class='diagonal gradient-bg-border'>
    </mj-section>
    <mj-section background-color="#9e60f2" padding-bottom="15px">
      ${htmlMetadata(reviewMetadata)}
    </mj-section>
    <mj-section background-color="#54278e" padding-bottom="20px" padding-top="20px">
      ${htmlActions(reviewActions)}
    </mj-section>
  `),
  ).html
}

function htmlMetadata(reviewMetadata: Info[]) {
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
      <mj-button background-color="#54278e" border="solid 2px white" color="#FFF" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="${action.url}" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">${action.name}</mj-button>
    </mj-column>
  `,
    )
    .join('')}`
}

function wrapper(children: string) {
  return dedent(`
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
      <mj-body background-color="#9e60f2">
        <mj-section background-color="#9e60f2" padding-bottom="0px" padding-top="0px">
        </mj-section>
        ${children}
      </mj-body>
    </mjml>
  `)
}
