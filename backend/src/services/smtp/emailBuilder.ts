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

export type EmailListItem = {
  label: string
  detail?: string
  url?: string
}

export type EmailList = {
  title: string
  items: EmailListItem[]
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
  list?: EmailList,
): Promise<EmailContent> {
  title = sanitizeInput(title)
  metadata = sanitizeInput(metadata)
  actions = sanitizeInput(actions)
  const sanitisedList = list?.items.length ? sanitizeInput(list) : undefined

  return {
    subject: actionRequired ? `ACTION REQUIRED: ${title}` : title,
    text: emailText(title, metadata, actions, sanitisedList),
    html: await emailHtml(title, metadata, actions, sanitisedList),
  }
}

function emailText(title: string, reviewMetadata: Info[], reviewActions: actions[], list?: EmailList) {
  return dedent(`
    ${title}

    ${textMetadata(reviewMetadata)}

    ${textList(list)}${textActions(reviewActions)}
  `)
}

function textList(list?: EmailList) {
  if (!list) {
    return ''
  }

  const items = list.items.map((item) => {
    const detail = item.detail ? ` (${item.detail})` : ''
    const url = item.url ? `: '${item.url}'` : ''
    return `- ${item.label}${detail}${url}\n`
  })

  return `${list.title}:\n${items.join('')}\n`
}

function textMetadata(reviewMetadata: Info[]) {
  return `${reviewMetadata.map((info) => `${info.title}: '${info.data}'\n`).join('')}`
}

function textActions(actionsList: actions[]) {
  return `${actionsList.map((action) => `${action.name}: '${action.url}'\n`).join('')}`
}

async function emailHtml(title: string, metadata: Info[], actions: actions[], list?: EmailList) {
  const mjml = emailTemplate({ title, metadata, actions, list })
  const email = await mjml2html(mjml)
  return email.html
}
