import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import { outdent } from 'outdent'
import { resolve } from 'path'

export type Common = {
  title: string
  description?: string
  widget?: string
}

export type Fragment = (
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
  | {
      type: 'boolean'
    }
) &
  Common

export const htmlTemplate = Handlebars.compile(
  readFileSync(resolve(import.meta.dirname, 'templates', 'htmlExport.hbs'), 'utf-8'),
)

export function recursiveRender(obj: any, schema: Fragment, output = '', depth = 1) {
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
    case 'boolean':
      if (obj === undefined) {
        obj = 'No response'
      } else {
        obj = obj ? 'Yes' : 'No'
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
