import { Schema as JsonSchema, Validator } from 'jsonschema'
import NodeCache from 'node-cache'

import { callLlmChatCompletion, ChatMessage, ChatMessageRole } from '../clients/llm.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { getSchemaById } from './schema.js'

// Widgets that represent entity/data relationships rather than user-editable content, excluded from LLM extraction
const EXCLUDED_WIDGETS = new Set(['dataCardSelector', 'entitySelector'])

const SCHEMA_DESCRIPTION_CACHE_TTL = 3600
const schemaDescriptionCache = new NodeCache({
  stdTTL: SCHEMA_DESCRIPTION_CACHE_TTL,
  checkperiod: SCHEMA_DESCRIPTION_CACHE_TTL,
  useClones: false,
})

// Flat representation of a schema field, used to describe the target structure to the LLM
interface FieldDescriptor {
  path: string
  title: string
  type: string
  description?: string
  format?: string
}

/**
 * Produces a compact, human-readable summary of an object schema's fields (e.g. "{ name: string, age: number }").
 * Used inside LLM prompts to describe the shape of nested objects and array items so the LLM knows what to extract.
 * Recurses into nested objects and annotates arrays with their item types and enum constraints.
 */
function describeObjectFields(schema: JsonSchema): string {
  if (!schema.properties) {
    return '{}'
  }
  const fieldSummaries: string[] = []
  for (const [fieldName, fieldSchema] of Object.entries(schema.properties) as [string, JsonSchema][]) {
    if (fieldSchema.type === 'array' && fieldSchema.items) {
      const arrayItemSchema = fieldSchema.items as JsonSchema
      if (arrayItemSchema.type === 'object' && arrayItemSchema.properties) {
        fieldSummaries.push(`${fieldName}: array of objects with fields: ${describeObjectFields(arrayItemSchema)}`)
      } else if (arrayItemSchema.enum) {
        fieldSummaries.push(
          `${fieldName}: array of ${arrayItemSchema.type || 'string'}, allowed values: [${(arrayItemSchema.enum as string[]).map((val) => `"${val}"`).join(', ')}]`,
        )
      } else {
        fieldSummaries.push(`${fieldName}: array of ${arrayItemSchema.type || 'string'}`)
      }
    } else if (fieldSchema.type === 'object' && fieldSchema.properties) {
      fieldSummaries.push(`${fieldName}: object with fields: ${describeObjectFields(fieldSchema)}`)
    } else {
      fieldSummaries.push(`${fieldName}: ${fieldSchema.type || 'string'}`)
    }
  }
  return `{ ${fieldSummaries.join(', ')} }`
}

/**
 * Walks a JSON Schema and produces a flat list of FieldDescriptors that the LLM uses as its extraction target.
 * Resolves $ref pointers (e.g. "#/definitions/securityClassification") so the LLM sees the actual type and enum
 * constraints. Skips fields whose widget type is in EXCLUDED_WIDGETS (entity selectors etc.) since those are not
 * populated from free text. Recurses into nested objects, building dot-separated paths (e.g. "overview.name").
 */
export function buildSchemaDescription(schema: JsonSchema, basePath = '', rootSchema?: JsonSchema): FieldDescriptor[] {
  const root = rootSchema || schema
  const fields: FieldDescriptor[] = []

  if (schema.type === 'object' && schema.properties) {
    for (const [key, rawProperty] of Object.entries(schema.properties) as [
      string,
      JsonSchema & { widget?: string; $ref?: string },
    ][]) {
      const fieldPath = basePath ? `${basePath}.${key}` : key

      // Resolve $ref so we see the actual type/enum constraints
      let property = rawProperty
      if (property.$ref) {
        const resolvedSchema = resolveRef(property.$ref, root)
        if (resolvedSchema) {
          property = { ...resolvedSchema, ...property, $ref: undefined } as typeof property
        }
      }

      if (property.widget && EXCLUDED_WIDGETS.has(property.widget)) {
        continue
      }

      if (property.type === 'object' && property.properties) {
        fields.push(...buildSchemaDescription(property, fieldPath, root))
      } else if (property.type === 'array' && property.items) {
        // Resolve $ref on array item schemas as well
        let arrayItemSchema = property.items as JsonSchema & { widget?: string; $ref?: string }
        if (arrayItemSchema.$ref) {
          const resolvedSchema = resolveRef(arrayItemSchema.$ref, root)
          if (resolvedSchema) {
            arrayItemSchema = { ...resolvedSchema, ...arrayItemSchema, $ref: undefined } as typeof arrayItemSchema
          }
        }
        let typeDescription: string
        if (arrayItemSchema.type === 'object' && arrayItemSchema.properties) {
          typeDescription = `array of objects with fields: ${describeObjectFields(arrayItemSchema)}`
        } else if (arrayItemSchema.enum) {
          typeDescription = `array of ${arrayItemSchema.type || 'string'}, allowed values: [${(arrayItemSchema.enum as string[]).map((val) => `"${val}"`).join(', ')}]`
        } else {
          typeDescription = `array of ${arrayItemSchema.type || 'string'}`
        }
        fields.push({
          path: fieldPath,
          title: property.title || key,
          type: typeDescription,
          ...(property.description && { description: property.description }),
        })
      } else if (property.enum) {
        fields.push({
          path: fieldPath,
          title: property.title || key,
          type: `${property.type || 'string'}, allowed values: [${(property.enum as string[]).map((val) => `"${val}"`).join(', ')}]`,
          ...(property.description && { description: property.description }),
        })
      } else {
        const format = (property as { format?: string }).format
        fields.push({
          path: fieldPath,
          title: property.title || key,
          type: format ? `${property.type || 'string'} (format: ${format})` : (property.type as string) || 'string',
          ...(property.description && { description: property.description }),
          ...(format && { format }),
        })
      }
    }
  }

  return fields
}

/**
 * Resolves a JSON Schema $ref pointer (e.g. "#/definitions/securityClassification") by walking the root schema.
 * Returns the referenced sub-schema, or undefined if the path doesn't exist.
 */
function resolveRef(ref: string, rootSchema: JsonSchema): JsonSchema | undefined {
  const segments = ref.replace('#/', '').split('/')
  let current: unknown = rootSchema
  for (const segment of segments) {
    if (typeof current === 'object' && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }
  return current as JsonSchema
}

/**
 * Removes keys from LLM-extracted data that don't exist in the schema, and cleans values to match schema constraints.
 * Specifically:
 *  - Drops keys not defined in schema.properties
 *  - Resolves $ref pointers before checking types
 *  - Skips fields with excluded widgets (entity selectors etc.)
 *  - Filters out null/undefined values and placeholder text (e.g. "N/A", example URLs)
 *  - Recursively cleans nested objects and arrays
 *  - Matches enum values case-insensitively, mapping to the schema-defined casing
 *  - Truncates strings exceeding maxLength
 *  - Only keeps values whose type matches the schema (string, number, boolean)
 */
function stripUnknownKeys(
  data: Record<string, unknown>,
  schema: JsonSchema,
  rootSchema?: JsonSchema,
): Record<string, unknown> {
  const root = rootSchema || schema
  if (schema.type !== 'object' || !schema.properties) {
    return data
  }

  const cleanedData: Record<string, unknown> = {}
  const schemaProperties = schema.properties as Record<string, JsonSchema & { widget?: string; $ref?: string }>

  for (const [key, value] of Object.entries(data)) {
    let propertySchema = schemaProperties[key]
    if (!propertySchema) {
      continue
    }

    // Resolve $ref so we can check the actual type and enum constraints
    if (propertySchema.$ref) {
      const resolvedSchema = resolveRef(propertySchema.$ref, root)
      if (resolvedSchema) {
        propertySchema = { ...resolvedSchema, ...propertySchema, $ref: undefined } as typeof propertySchema
      }
    }

    if (propertySchema.widget && EXCLUDED_WIDGETS.has(propertySchema.widget)) {
      continue
    }

    if (value === null || value === undefined) {
      continue
    }

    if (isPlaceholderValue(value)) {
      continue
    }

    if (propertySchema.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNestedObject = stripUnknownKeys(value as Record<string, unknown>, propertySchema, root)
      if (Object.keys(cleanedNestedObject).length > 0) {
        cleanedData[key] = cleanedNestedObject
      }
    } else if (propertySchema.type === 'array' && Array.isArray(value)) {
      let arrayItemSchema = propertySchema.items as (JsonSchema & { $ref?: string }) | undefined
      if (arrayItemSchema?.$ref) {
        const resolvedSchema = resolveRef(arrayItemSchema.$ref, root)
        if (resolvedSchema) {
          arrayItemSchema = { ...resolvedSchema, ...arrayItemSchema, $ref: undefined } as typeof arrayItemSchema
        }
      }
      const cleanedArray = cleanArrayItems(value, key, arrayItemSchema, root)
      if (cleanedArray.length > 0) {
        cleanedData[key] = cleanedArray
      }
    } else if (propertySchema.type === 'string' && typeof value === 'string') {
      const cleanedString = cleanStringValue(value, key, propertySchema)
      if (cleanedString !== undefined) {
        cleanedData[key] = cleanedString
      }
    } else if (propertySchema.type === 'number' && typeof value === 'number') {
      cleanedData[key] = value
    } else if (propertySchema.type === 'boolean' && typeof value === 'boolean') {
      cleanedData[key] = value
    }
  }

  return cleanedData
}

/**
 * Cleans an array of LLM-extracted values against the schema for the array's items.
 * For object items, recursively strips unknown keys. For enum items, matches case-insensitively
 * and drops unmatched values. Filters out nulls and placeholder values from the result.
 */
export function cleanArrayItems(
  items: unknown[],
  fieldKey: string,
  arrayItemSchema: (JsonSchema & { $ref?: string }) | undefined,
  rootSchema: JsonSchema,
): unknown[] {
  return items
    .map((arrayItem) => {
      if (arrayItemSchema?.type === 'object' && typeof arrayItem === 'object' && arrayItem !== null) {
        return stripUnknownKeys(arrayItem as Record<string, unknown>, arrayItemSchema, rootSchema)
      }
      if (arrayItemSchema?.enum) {
        const matchedValue = typeof arrayItem === 'string' ? matchEnumValue(arrayItem, arrayItemSchema.enum) : undefined
        if (matchedValue === undefined) {
          log.warn(
            { key: fieldKey, value: arrayItem, allowedValues: arrayItemSchema.enum },
            'Dropping array item: no matching enum value.',
          )
        }
        return matchedValue !== undefined ? matchedValue : null
      }
      return arrayItem
    })
    .filter((arrayItem) => arrayItem !== null && arrayItem !== undefined && !isPlaceholderValue(arrayItem))
}

/**
 * Cleans a string value against its schema constraints: truncates to maxLength, matches enum values
 * case-insensitively, or passes through unchanged. Returns undefined if the value should be dropped.
 */
export function cleanStringValue(
  value: string,
  fieldKey: string,
  propertySchema: JsonSchema & { maxLength?: number },
): string | undefined {
  const maxLength = propertySchema.maxLength as number | undefined
  if (maxLength && value.length > maxLength) {
    return value.slice(0, maxLength)
  }
  if (propertySchema.enum) {
    const matchedValue = matchEnumValue(value, propertySchema.enum)
    if (matchedValue !== undefined) {
      return matchedValue
    }
    log.warn({ key: fieldKey, value, allowedValues: propertySchema.enum }, 'Dropping field: no matching enum value.')
    return undefined
  }
  return value
}

/**
 * Attempts to match a value against a list of allowed enum values, first by exact match, then case-insensitively.
 * Returns the schema-defined casing if a match is found (e.g. input "periodically" matches enum "PERIODICALLY").
 */
function matchEnumValue(value: string, enumValues: unknown[]): string | undefined {
  const exactMatch = enumValues.find((entry) => entry === value)
  if (exactMatch !== undefined) {
    return exactMatch as string
  }
  const lowerCaseValue = value.trim().toLowerCase()
  const caseInsensitiveMatch = enumValues.find(
    (entry) => typeof entry === 'string' && entry.trim().toLowerCase() === lowerCaseValue,
  )
  return caseInsensitiveMatch as string | undefined
}

/**
 * Detects LLM-generated placeholder values that should be discarded rather than saved to the model card.
 * Catches common patterns: generic strings like "N/A" or "Not specified", fake URLs (example.com, placeholder),
 * and invalid date strings that parse to NaN.
 */
function isPlaceholderValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const normalised = value.trim().toLowerCase()

  const placeholderStrings = [
    'n/a',
    'not specified',
    'not available',
    'unknown',
    'none',
    'tbd',
    'to be determined',
    'not applicable',
  ]
  if (placeholderStrings.includes(normalised)) {
    return true
  }

  if (isPlaceholderUrl(value.trim())) {
    return true
  }

  if (isInvalidDateString(value.trim())) {
    return true
  }

  return false
}

/**
 * Detects fake or example URLs that LLMs commonly generate as placeholder values.
 */
export function isPlaceholderUrl(value: string): boolean {
  const placeholderUrlPattern = /^https?:\/\/(example\.com|www\.example\.|placeholder|your-|insert-|link-here)/i
  return placeholderUrlPattern.test(value)
}

/**
 * Detects date-formatted strings (YYYY-MM-DD) that don't parse to a valid date (e.g. "0000-00-00").
 * Returns false for non-date strings and valid dates.
 */
export function isInvalidDateString(value: string): boolean {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!isoDatePattern.test(value)) {
    return false
  }
  const parsedDate = new Date(value)
  return isNaN(parsedDate.getTime())
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
): Promise<{ metadata: Record<string, unknown>; warnings: string[] }> {
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
  const warnings = validationResult.errors.map((err) => `${err.property}: ${err.message}`)

  if (warnings.length > 0) {
    log.warn({ modelId, warnings }, 'Extracted data has validation issues.')
  }

  log.info({ modelId, extractedKeys: Object.keys(cleaned) }, 'Successfully extracted model card data from text.')

  return { metadata: cleaned, warnings }
}
