import { Schema as JsonSchema, Validator } from 'jsonschema'

import { callLlmChatCompletion, ChatMessage } from '../clients/llm.js'
import { UserInterface } from '../models/User.js'
import { BadReq } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { getSchemaById } from './schema.js'

const EXCLUDED_WIDGETS = new Set(['dataCardSelector', 'entitySelector'])

interface FieldDescriptor {
  path: string
  title: string
  type: string
  description?: string
  format?: string
}

function describeObjectFields(schema: JsonSchema): string {
  if (!schema.properties) return '{}'
  const parts: string[] = []
  for (const [k, v] of Object.entries(schema.properties) as [string, JsonSchema][]) {
    if (v.type === 'array' && v.items) {
      const items = v.items as JsonSchema
      if (items.type === 'object' && items.properties) {
        parts.push(`${k}: array of objects with fields: ${describeObjectFields(items)}`)
      } else if (items.enum) {
        parts.push(
          `${k}: array of ${items.type || 'string'}, allowed values: [${(items.enum as string[]).map((e) => `"${e}"`).join(', ')}]`,
        )
      } else {
        parts.push(`${k}: array of ${items.type || 'string'}`)
      }
    } else if (v.type === 'object' && v.properties) {
      parts.push(`${k}: object with fields: ${describeObjectFields(v)}`)
    } else {
      parts.push(`${k}: ${v.type || 'string'}`)
    }
  }
  return `{ ${parts.join(', ')} }`
}

export function buildSchemaDescription(schema: JsonSchema, basePath = ''): FieldDescriptor[] {
  const fields: FieldDescriptor[] = []

  if (schema.type === 'object' && schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties) as [string, JsonSchema & { widget?: string }][]) {
      const path = basePath ? `${basePath}.${key}` : key

      if (prop.widget && EXCLUDED_WIDGETS.has(prop.widget)) {
        continue
      }

      if (prop.type === 'object' && prop.properties) {
        fields.push(...buildSchemaDescription(prop, path))
      } else if (prop.type === 'array' && prop.items) {
        const items = prop.items as JsonSchema & { widget?: string }
        let typeDesc: string
        if (items.type === 'object' && items.properties) {
          typeDesc = `array of objects with fields: ${describeObjectFields(items)}`
        } else if (items.enum) {
          typeDesc = `array of ${items.type || 'string'}, allowed values: [${(items.enum as string[]).map((v) => `"${v}"`).join(', ')}]`
        } else {
          typeDesc = `array of ${items.type || 'string'}`
        }
        fields.push({
          path,
          title: prop.title || key,
          type: typeDesc,
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
    if (!propSchema) continue

    if (propSchema.$ref) {
      const resolved = resolveRef(propSchema.$ref, root)
      if (resolved) {
        propSchema = { ...resolved, ...propSchema, $ref: undefined } as typeof propSchema
      }
    }

    if (propSchema.widget && EXCLUDED_WIDGETS.has(propSchema.widget)) continue

    if (value === null || value === undefined) continue

    if (isPlaceholderValue(value)) continue

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
          if (itemSchema?.enum && !itemSchema.enum.includes(item)) {
            return null
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
      } else if (propSchema.enum && !propSchema.enum.includes(value)) {
        // skip values not in the enum
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

function isPlaceholderValue(value: unknown): boolean {
  if (typeof value !== 'string') return false
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
  const systemMessage = `You are a data extraction assistant. You will be given a model card text document and a target JSON schema. Extract information from the document into the schema format.

CRITICAL RULES:
- Only extract information that is EXPLICITLY stated in the source document.
- If a field cannot be populated from the document, omit it entirely from the output.
- Do NOT infer, guess, or hallucinate any values.
- Do NOT generate placeholder text like "Not specified", "N/A", or "Unknown" — leave the field out.
- Do NOT generate placeholder or example URLs. Only include a URL if it appears verbatim in the source document.
- Do NOT infer or generate dates. Only populate date fields if an explicit date is clearly stated in the source document for that specific purpose.
- Return valid JSON matching the schema structure exactly.
- For string fields, extract the relevant text verbatim or as a close summary.
- For array fields, extract all matching items found in the document.
- For number fields, extract numeric values only if explicitly stated.
- For boolean fields, extract true/false only if the answer is clearly stated.
- When a field specifies a format (e.g. "date", "date-time", "email", "uri"), output values in the standard format for that type (e.g. YYYY-MM-DD for date, ISO 8601 for date-time).
- The output JSON must use the exact property names from the schema (the "path" field).`

  const schemaDescription = JSON.stringify(fields, null, 2)

  const userMessage = `TARGET SCHEMA FIELDS:
${schemaDescription}

SOURCE DOCUMENT:
${text}

Extract the information from the source document into the target schema format.
The output must be a JSON object where the top-level keys are the first segment of each field path (e.g., "overview", "anotherPage"), containing nested objects matching the schema structure.
Return ONLY the JSON object.`

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage },
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
  const fields = buildSchemaDescription(schema.jsonSchema)

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
      { modelId, errors: validationResult.errors.map((e) => `${e.property}: ${e.message}`) },
      'Extracted data has validation issues, stripping invalid fields.',
    )
  }

  log.info({ modelId, extractedKeys: Object.keys(cleaned) }, 'Successfully extracted model card data from text.')

  return cleaned
}
