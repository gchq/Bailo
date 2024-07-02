import { outdent } from 'outdent'
import showdown from 'showdown'

import { UserInterface } from '../models/User.js'
import { GetModelCardVersionOptionsKeys } from '../types/enums.js'
import { getModelById, getModelCard } from './model.js'
import { findSchemaById } from './schema.js'

type Common = {
  title: string
  description?: string
  widget?: string
}

type Fragment = (
  | {
      type: 'object'
      properties: {
        [x: string]: Fragment
      }
    }
  | {
      type: 'array'
      items: Fragment
    }
  | {
      type: 'string'
      maxLength: number
    }
  | {
      type: 'number'
    }
) &
  Common

export async function renderToMarkdown(
  user: UserInterface,
  modelId: string,
  version: number | GetModelCardVersionOptionsKeys,
) {
  const model = await getModelById(user, modelId)
  if (!model || !model.card) {
    throw new Error('Trying to export model with no corresponding card')
  }

  const card = await getModelCard(user, modelId, version)
  if (!card) {
    throw new Error('Could not find specified model card')
  }

  const schema = await findSchemaById(card.schemaId)
  if (!schema) {
    throw new Error('Trying to export model with no corresponding card')
  }

  let output = outdent`
    # ${model.name}
    > ${model.description}
  `

  // 'Fragment' is a more strictly typed version of 'JsonSchema'.
  output = recursiveRender(card.metadata, schema.jsonSchema as Fragment, output)
  return { markdown: output, card }
}

export async function renderToHtml(
  user: UserInterface,
  modelId: string,
  version: number | GetModelCardVersionOptionsKeys,
) {
  const { markdown, card } = await renderToMarkdown(user, modelId, version)
  const converter = new showdown.Converter()
  converter.setFlavor('github')
  const body = converter.makeHtml(markdown)

  const html = `
    <html>
      <head>
        <style>.exampe { color: red; }</style>
      </head>
      <body>${body}</body>
    </html>
  `

  return { html, card }
}

function recursiveRender(obj: any, schema: Fragment, output = '', depth = 1) {
  switch (schema.widget) {
    case 'tagSelector':
      if (obj === undefined || obj.length === 0) {
        output += outdent`\n\n
          ${'#'.repeat(depth)} ${schema.title}

          No entries
        `
        return output
      }

      output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj.map((item: string) => `- ${item}`).join('\n')}
        `

      return output
    default:
    // go to normal rendering
  }

  switch (schema.type) {
    case 'object':
      if (schema.title) {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}
        `
      }

      for (const property in schema.properties) {
        // Render sub properties
        output = recursiveRender((obj || {})[property], schema.properties[property], output, depth + 1)
      }

      break
    case 'array': {
      if (schema.title) {
        output += outdent`\n\n
              ${'#'.repeat(depth)} ${schema.title}
          `
      }

      const count = 0
      if (obj === undefined || obj.length === 0) {
        output += outdent`\n\n
          No entries
        `
        break
      }

      for (const value of obj) {
        output += outdent`\n\n
          ${'#'.repeat(depth + 1)} Entry #${count}
        `
        output = recursiveRender(value, schema.items, output, depth + 1)
      }
      break
    }
    case 'number':
      // We can add a description like this, but I felt it overkill:
      // ${schema.description ? `> ${schema.description}` : ''}

      if (!obj) {
        obj = 'No response'
      }

      output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      break
    case 'string':
      if (obj === undefined || obj === '') {
        obj = 'No response'
      }

      output += outdent`\n\n
          ${'#'.repeat(depth)} ${schema.title}

          ${obj}
      `
      break
    default:
      throw new Error(
        `One of the types within this schema has not been implemented in the export method.  Received type ${(schema as any).type}`,
      )
  }

  return output
}
