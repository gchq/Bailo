import dedent from 'dedent-js'
import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import mjml2html from 'mjml'
import Mail from 'nodemailer/lib/mailer/index.js'
import { resolve } from 'path'
import sanitizeHtml from 'sanitize-html'

const emailTemplate = Handlebars.compile(readFileSync(resolve(import.meta.dirname, 'templates', 'email.hbs'), 'utf-8'))

export type EmailContent = Pick<Mail.Options, 'subject' | 'text' | 'html' | 'attachments'>

export type Info = {
  title: string
  data: string
}

export type actions = {
  name: string
  url: string
}

function sanitizeInput<T>(input: T) {
  if (input === null) {
    return null
  }

  if (typeof input === 'string') {
    return sanitizeHtml(input)
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(input)) {
      result[key] = sanitizeInput(val)
    }
    return result
  }

  return input
}
export async function buildEmail(
  title: string,
  metadata: Info[],
  actions: actions[],
  actionRequired?: boolean,
): Promise<EmailContent> {
  title = sanitizeInput(title)
  metadata = sanitizeInput(metadata)
  actions = sanitizeInput(actions)

  return {
    subject: actionRequired ? `ACTION REQUIRED: ${title}` : title,
    text: emailText(title, metadata, actions),
    html: await emailHtml(title, metadata, actions),
  }
}

function emailText(title: string, reviewMetadata: Info[], reviewActions: actions[]) {
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

async function emailHtml(title: string, metadata: Info[], actions: actions[]) {
  const mjml = emailTemplate({ title, metadata, actions })
  const email = await mjml2html(mjml)
  return email.html
}
