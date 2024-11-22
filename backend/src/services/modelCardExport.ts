import { outdent } from 'outdent'
import showdown from 'showdown'

import { ModelInterface } from '../models/Model.js'
import { ModelCardRevisionInterface } from '../models/ModelCardRevision.js'
import { getSchemaById } from './schema.js'

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

export async function renderToMarkdown(model: ModelInterface, modelCardRevision: ModelCardRevisionInterface) {
  if (!model.card) {
    throw new Error('Trying to export model with no corresponding card')
  }

  const schema = await getSchemaById(modelCardRevision.schemaId)
  if (!schema) {
    throw new Error('Trying to export model with no corresponding card')
  }

  let output = outdent`
    # ${model.name}
    > ${model.description}
  `

  // 'Fragment' is a more strictly typed version of 'JsonSchema'.
  output = recursiveRender(modelCardRevision.metadata, schema.jsonSchema as Fragment, output)
  return output
}

export async function renderToHtml(model: ModelInterface, modelCardRevision: ModelCardRevisionInterface) {
  const markdown = await renderToMarkdown(model, modelCardRevision)
  const converter = new showdown.Converter()
  converter.setFlavor('github')
  const body = converter.makeHtml(markdown)

  const html = `
    <html>
      <head>
        <style>
          body { margin: 0px; font-family: Helvetica; color: #1e1e1e; background-color: #f9f9f9; }
          h1 { text-align: center }
          h2 { margin-top: 32px; margin-bottom: 16px }
          h3 { margin-top: 24px; margin-bottom: 8px }
          h4 { margin-top: 16px; margin-bottom: 8px }
          h5 { margin-top: 16px; margin-bottom: 8px }
          h6 { margin-top: 16px; margin-bottom: 8px }
          p { margin-top: 8px; margin-bottom: 8px }
        </style>
      </head>
      <body>
        <div style="padding-left: 8px; height: 64px; width: 100%; background: linear-gradient(276deg, rgba(214,37,96,1) 0%, rgba(84,39,142,1) 100%)">
          <div style="line-height: 64px; color: white; font-size: 20px; text-align: left; max-width: 900px; margin: auto">
            Bailo
          </div>
        </div>
        <div style="margin: 8px; max-width: 900px; margin: auto; margin-bottom: 16px; overflow-wrap: break-word">
          ${body}
        </div>
      </body>
    </html>
  `

  return html
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
          ${'#'.repeat(depth + 1)} Entry #${count + 1}
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

      if (schema.title) {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      } else {
        output += outdent`\n\n
            ${obj}
        `
      }
      break
    default:
      throw new Error(
        `One of the types within this schema has not been implemented in the export method.  Received type ${(schema as any).type}`,
      )
  }

  return output
}
