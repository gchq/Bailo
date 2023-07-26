import useSWR from 'swr'

import { ErrorInfo, fetcher } from '../utils/fetcher'

export interface SchemaInterface {
  id: string
  name: string

  inactive: boolean
  hidden: boolean

  kind: SchemaKindKeys
  display: string
  fields: unknown
  metadata: unknown

  createdAt: Date
  updatedAt: Date
}

export const SchemaKind = {
  Model: 'model',
  Deployment: 'deployment',
} as const

export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export function useGetSchemas() {
  const { data, error, mutate } = useSWR<
    {
      data: { schemas: SchemaInterface[] }
    },
    ErrorInfo
  >('/api/v2/schemas/', fetcher)

  return {
    mutateSchemas: mutate,
    schemas: data ? data.data.schemas : undefined,
    isSchemasLoading: !error && !data,
    isSchemasError: error,
  }
}

export function useGetSchema(id: string) {
  const { data, error, mutate } = useSWR<
    {
      data: { schema: SchemaInterface }
    },
    ErrorInfo
  >(id ? `/api/v2/schema/${id}` : null, fetcher)

  return {
    mutateSchema: mutate,
    schema: data ? data.data.schema : undefined,
    isSchemaLoading: !error && !data,
    isSchemaError: error,
  }
}
