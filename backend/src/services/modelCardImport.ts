import { Schema as JsonSchema } from 'jsonschema'

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
          const subFields = Object.entries(items.properties as Record<string, JsonSchema>)
            .map(([k, v]) => `${k}: ${v.type || 'string'}`)
            .join(', ')
          typeDesc = `array of objects with fields: { ${subFields} }`
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

function stripUnknownKeys(data: Record<string, unknown>, schema: JsonSchema): Record<string, unknown> {
  if (schema.type !== 'object' || !schema.properties) {
    return data
  }

  const result: Record<string, unknown> = {}
  const props = schema.properties as Record<string, JsonSchema & { widget?: string }>

  for (const [key, value] of Object.entries(data)) {
    const propSchema = props[key]
    if (!propSchema) continue

    if (propSchema.widget && EXCLUDED_WIDGETS.has(propSchema.widget)) continue

    if (value === null || value === undefined) continue

    if (isPlaceholderValue(value)) continue

    if (propSchema.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      const cleaned = stripUnknownKeys(value as Record<string, unknown>, propSchema)
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned
      }
    } else if (propSchema.type === 'array' && Array.isArray(value)) {
      const items = propSchema.items as JsonSchema | undefined
      const cleaned = value
        .map((item) => {
          if (items?.type === 'object' && typeof item === 'object' && item !== null) {
            return stripUnknownKeys(item as Record<string, unknown>, items)
          }
          return item
        })
        .filter((item) => item !== null && item !== undefined && !isPlaceholderValue(item))

      if (cleaned.length > 0) {
        result[key] = cleaned
      }
    } else if (propSchema.type === 'string' && typeof value === 'string') {
      result[key] = value
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
  return ['n/a', 'not specified', 'not available', 'unknown', 'none', 'tbd', 'to be determined'].includes(normalised)
}

function buildPromptMessages(fields: FieldDescriptor[], text: string): ChatMessage[] {
  const systemMessage = `You are a data extraction assistant. You will be given a model card text document and a target JSON schema. Extract information from the document into the schema format.

CRITICAL RULES:
- Only extract information that is EXPLICITLY stated in the source document.
- If a field cannot be populated from the document, omit it entirely from the output.
- Do NOT infer, guess, or hallucinate any values.
- Do NOT generate placeholder text like "Not specified", "N/A", or "Unknown" — leave the field out.
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

  log.info(
    { modelId, extractedKeys: Object.keys(cleaned) },
    'Successfully extracted model card data from text.',
  )

  return cleaned
}
