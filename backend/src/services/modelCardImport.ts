import { Schema as JsonSchema, Validator } from 'jsonschema'
import NodeCache from 'node-cache'

import { callLlmChatCompletion, ChatMessage, ChatMessageRole } from '../clients/llm.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { getSchemaById } from './schema.js'

const EXCLUDED_WIDGETS = new Set(['dataCardSelector', 'entitySelector'])

const SCHEMA_DESCRIPTION_CACHE_TTL = 3600
const schemaDescriptionCache = new NodeCache({
  stdTTL: SCHEMA_DESCRIPTION_CACHE_TTL,
  checkperiod: SCHEMA_DESCRIPTION_CACHE_TTL,
  useClones: false,
})

interface FieldDescriptor {
  path: string
  title: string
  type: string
  description?: string
  format?: string
}

function describeObjectFields(schema: JsonSchema): string {
  if (!schema.properties) {
    return '{}'
  }
  const parts: string[] = []
  for (const [key, prop] of Object.entries(schema.properties) as [string, JsonSchema][]) {
    if (prop.type === 'array' && prop.items) {
      const items = prop.items as JsonSchema
      if (items.type === 'object' && items.properties) {
        parts.push(`${key}: array of objects with fields: ${describeObjectFields(items)}`)
      } else if (items.enum) {
        parts.push(
          `${key}: array of ${items.type || 'string'}, allowed values: [${(items.enum as string[]).map((val) => `"${val}"`).join(', ')}]`,
        )
      } else {
        parts.push(`${key}: array of ${items.type || 'string'}`)
      }
    } else if (prop.type === 'object' && prop.properties) {
      parts.push(`${key}: object with fields: ${describeObjectFields(prop)}`)
    } else {
      parts.push(`${key}: ${prop.type || 'string'}`)
    }
  }
  return `{ ${parts.join(', ')} }`
}

export function buildSchemaDescription(schema: JsonSchema, basePath = '', rootSchema?: JsonSchema): FieldDescriptor[] {
  const root = rootSchema || schema
  const fields: FieldDescriptor[] = []

  if (schema.type === 'object' && schema.properties) {
    for (const [key, rawProp] of Object.entries(schema.properties) as [
      string,
      JsonSchema & { widget?: string; $ref?: string },
    ][]) {
      const path = basePath ? `${basePath}.${key}` : key

      let prop = rawProp
      if (prop.$ref) {
        const resolved = resolveRef(prop.$ref, root)
        if (resolved) {
          prop = { ...resolved, ...prop, $ref: undefined } as typeof prop
        }
      }

      if (prop.widget && EXCLUDED_WIDGETS.has(prop.widget)) {
        continue
      }

      if (prop.type === 'object' && prop.properties) {
        fields.push(...buildSchemaDescription(prop, path, root))
      } else if (prop.type === 'array' && prop.items) {
        let items = prop.items as JsonSchema & { widget?: string; $ref?: string }
        if (items.$ref) {
          const resolved = resolveRef(items.$ref, root)
          if (resolved) {
            items = { ...resolved, ...items, $ref: undefined } as typeof items
          }
        }
        let typeDesc: string
        if (items.type === 'object' && items.properties) {
          typeDesc = `array of objects with fields: ${describeObjectFields(items)}`
        } else if (items.enum) {
          typeDesc = `array of ${items.type || 'string'}, allowed values: [${(items.enum as string[]).map((val) => `"${val}"`).join(', ')}]`
        } else {
          typeDesc = `array of ${items.type || 'string'}`
        }
        fields.push({
          path,
          title: prop.title || key,
          type: typeDesc,
          ...(prop.description && { description: prop.description }),
        })
      } else if (prop.enum) {
        fields.push({
          path,
          title: prop.title || key,
          type: `${prop.type || 'string'}, allowed values: [${(prop.enum as string[]).map((val) => `"${val}"`).join(', ')}]`,
          ...(prop.description && { description: prop.description }),
        })
      } else {
        const format = (prop as { format?: string }).format
        fields.push({
          path,
          title: prop.title || key,
          type: format ? `${prop.type || 'string'} (format: ${format})` : (prop.type as string) || 'string',
          ...(prop.description && { description: prop.description }),
          ...(format && { format }),
        })
      }
    }
  }

  return fields
}

function resolveRef(ref: string, rootSchema: JsonSchema): JsonSchema | undefined {
  const path = ref.replace('#/', '').split('/')
  let current: unknown = rootSchema
  for (const segment of path) {
    if (typeof current === 'object' && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }
  return current as JsonSchema
}

function stripUnknownKeys(
  data: Record<string, unknown>,
  schema: JsonSchema,
  rootSchema?: JsonSchema,
): Record<string, unknown> {
  const root = rootSchema || schema
  if (schema.type !== 'object' || !schema.properties) {
    return data
  }

  const result: Record<string, unknown> = {}
  const props = schema.properties as Record<string, JsonSchema & { widget?: string; $ref?: string }>

  for (const [key, value] of Object.entries(data)) {
    let propSchema = props[key]
    if (!propSchema) {
      continue
    }

    if (propSchema.$ref) {
      const resolved = resolveRef(propSchema.$ref, root)
      if (resolved) {
        propSchema = { ...resolved, ...propSchema, $ref: undefined } as typeof propSchema
      }
    }

    if (propSchema.widget && EXCLUDED_WIDGETS.has(propSchema.widget)) {
      continue
    }

    if (value === null || value === undefined) {
      continue
    }

    if (isPlaceholderValue(value)) {
      continue
    }

    if (propSchema.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      const cleaned = stripUnknownKeys(value as Record<string, unknown>, propSchema, root)
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned
      }
    } else if (propSchema.type === 'array' && Array.isArray(value)) {
      let itemSchema = propSchema.items as (JsonSchema & { $ref?: string }) | undefined
      if (itemSchema?.$ref) {
        const resolved = resolveRef(itemSchema.$ref, root)
        if (resolved) {
          itemSchema = { ...resolved, ...itemSchema, $ref: undefined } as typeof itemSchema
        }
      }
      const cleaned = value
        .map((item) => {
          if (itemSchema?.type === 'object' && typeof item === 'object' && item !== null) {
            return stripUnknownKeys(item as Record<string, unknown>, itemSchema, root)
          }
          if (itemSchema?.enum) {
            const matched = typeof item === 'string' ? matchEnumValue(item, itemSchema.enum) : undefined
            if (matched === undefined) {
              log.warn(
                { key, value: item, allowedValues: itemSchema.enum },
                'Dropping array item: no matching enum value.',
              )
            }
            return matched !== undefined ? matched : null
          }
          return item
        })
        .filter((item) => item !== null && item !== undefined && !isPlaceholderValue(item))

      if (cleaned.length > 0) {
        result[key] = cleaned
      }
    } else if (propSchema.type === 'string' && typeof value === 'string') {
      const maxLength = propSchema.maxLength as number | undefined
      if (maxLength && value.length > maxLength) {
        result[key] = value.slice(0, maxLength)
      } else if (propSchema.enum) {
        const matched = matchEnumValue(value, propSchema.enum)
        if (matched !== undefined) {
          result[key] = matched
        } else {
          log.warn({ key, value, allowedValues: propSchema.enum }, 'Dropping field: no matching enum value.')
        }
      } else {
        result[key] = value
      }
    } else if (propSchema.type === 'number' && typeof value === 'number') {
      result[key] = value
    } else if (propSchema.type === 'boolean' && typeof value === 'boolean') {
      result[key] = value
    }
  }

  return result
}

function matchEnumValue(value: string, enumValues: unknown[]): string | undefined {
  const exact = enumValues.find((entry) => entry === value)
  if (exact !== undefined) {
    return exact as string
  }
  const lower = value.trim().toLowerCase()
  const match = enumValues.find((entry) => typeof entry === 'string' && entry.trim().toLowerCase() === lower)
  return match as string | undefined
}

function isPlaceholderValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const normalised = value.trim().toLowerCase()
  if (
    ['n/a', 'not specified', 'not available', 'unknown', 'none', 'tbd', 'to be determined', 'not applicable'].includes(
      normalised,
    )
  ) {
    return true
  }
  if (/^https?:\/\/(example\.com|www\.example\.|placeholder|your-|insert-|link-here)/i.test(value.trim())) {
    return true
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const date = new Date(value.trim())
    if (isNaN(date.getTime())) {
      return true
    }
  }
  return false
}

function buildPromptMessages(fields: FieldDescriptor[], text: string): ChatMessage[] {
  const systemMessage = config.llm.systemPrompt

  const schemaDescription = JSON.stringify(fields, null, 2)

  const userMessage = `TARGET SCHEMA FIELDS:
${schemaDescription}

SOURCE DOCUMENT:
${text}

Extract the information from the source document into the target schema format.
The output must be a JSON object where the top-level keys are the first segment of each field path (e.g., "overview", "anotherPage"), containing nested objects matching the schema structure.
Return ONLY the JSON object.`

  return [
    { role: ChatMessageRole.SYSTEM, content: systemMessage },
    { role: ChatMessageRole.USER, content: userMessage },
  ]
}

export async function extractModelCardFromText(
  user: UserInterface,
  modelId: string,
  text: string,
): Promise<Record<string, unknown>> {
  const model = await getModelById(user, modelId)
  const schemaId = model.card?.schemaId

  if (!schemaId) {
    throw BadReq('Model does not have a schema selected. Please select a schema before importing.')
  }

  const schema = await getSchemaById(schemaId)

  let fields = schemaDescriptionCache.get<FieldDescriptor[]>(schemaId)
  if (!fields) {
    fields = buildSchemaDescription(schema.jsonSchema)
    schemaDescriptionCache.set(schemaId, fields)
  }

  log.info({ modelId, fieldCount: fields.length }, 'Extracting model card data from text via LLM.')

  const messages = buildPromptMessages(fields, text)
  const responseText = await callLlmChatCompletion(messages)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(responseText) as Record<string, unknown>
  } catch {
    log.warn({ modelId, responseText: responseText.slice(0, 500) }, 'LLM returned invalid JSON.')
    throw BadReq('LLM returned invalid JSON. Please try again.')
  }

  const cleaned = stripUnknownKeys(parsed, schema.jsonSchema)

  const validationResult = new Validator().validate(cleaned, schema.jsonSchema)
  if (validationResult.errors.length > 0) {
    log.warn(
      { modelId, errors: validationResult.errors.map((err) => `${err.property}: ${err.message}`) },
      'Extracted data has validation issues, stripping invalid fields.',
    )
  }

  log.info({ modelId, extractedKeys: Object.keys(cleaned) }, 'Successfully extracted model card data from text.')

  return cleaned
}
