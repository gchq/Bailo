import { SerializerOptions } from 'server/utils/logger'

export function serializedSchemaFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'reference', 'name', 'use'],
  }
}
