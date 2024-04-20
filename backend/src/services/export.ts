import { outdent } from 'outdent'

import { ModelInterface } from '../models/Model.js'
import { SchemaInterface } from '../models/Schema.js'
import { UserInterface } from '../models/User.js'

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

export async function renderToMarkdown(user: UserInterface, model: ModelInterface, schema: SchemaInterface) {
  if (!model.card) {
    throw new Error('Trying to export model with no corresponding card')
  }

  let output = outdent`
    # ${model.name}
    > ${model.description}
  `

  // 'Fragment' is a more strictly typed version of 'JsonSchema'.
  output = recursiveRender(model.card.metadata, schema.jsonSchema as Fragment, output)
  return output
}

function recursiveRender(obj: any, schema: Fragment, output = '', depth = 1) {
  switch (schema.widget) {
    case 'tagSelector':
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
        output = recursiveRender(obj[property], schema.properties[property], output, depth + 1)
      }

      break
    case 'array': {
      if (schema.title) {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}
        `
      }

      const count = 0
      for (const value of obj) {
        output += outdent`\n\n
            ${'#'.repeat(depth + 1)} Entry #${count}
        `
        output = recursiveRender(value, schema.items, output, depth + 1)
      }
      break
    }
    case 'number':
      if (obj !== undefined) {
        // We can add a description like this, but I felt it overkill:
        // ${schema.description ? `> ${schema.description}` : ''}

        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      }
      break
    case 'string':
      if (obj !== undefined && obj !== '') {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      }
      break
    default:
      throw new Error(
        `One of the types within this schema has not been implemented in the export method.  Received type ${schema.type}`,
      )
  }

  return output
}
