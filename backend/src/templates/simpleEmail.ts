import mjml2html from 'mjml'

import { wrapper } from './partials.js'

export interface Column {
  header: string
  value: string
}

export interface Button {
  text: string
  href: string
}

export interface SimpleEmail {
  text: string
  columns: Array<Column>
  buttons: Array<Button>
  subject: string
}

function formatColumn(column: Column) {
  return `
    <mj-column>
      <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px">
        <strong>
          ${column.header}
        </strong>
      </mj-text>
      <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">
        ${column.value}  
      </mj-text>
    </mj-column>
  `
}

function formatButton(button: Button, total: number) {
  return `
    <mj-column width="${100 / total}%">
      <mj-button
        background-color="#f37f58"
        color="#FFF"
        font-size="14px"
        align="center"
        font-weight="bold"
        border="none"
        padding="15px 30px"
        border-radius="10px"
        href="${button.href}"
        font-family="Helvetica"
        padding-left="25px"
        padding-right="25px"
        padding-bottom="10px">
        ${button.text}
      </mj-button>
    </mj-column>      
  `
}

export function html({ text, columns, buttons }: SimpleEmail) {
  return mjml2html(
    wrapper(`
    <mj-section background-color="#27598e" padding-bottom="5px" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px">
          <span style="font-size:20px; font-weight:bold">${text}</span>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#356cc7" padding-bottom="15px">
      ${columns.map(formatColumn).join('\n')}
    </mj-section>
    <mj-section background-color="#27598e" padding-bottom="20px" padding-top="20px">
      ${buttons.map((button) => formatButton(button, buttons.length))}
    </mj-section>
  `)
  ).html
}

export function simpleEmail(email: SimpleEmail) {
  return {
    html: html(email),
    text: email.text,
    subject: email.subject,
  }
}
