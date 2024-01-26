import useSWR from 'swr'

import { SchemaInterface } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export enum SchemaKind {
  MODEL = 'model',
  ACCESS = 'accessRequest',
}

export interface PostSchemaParams {
  id: string
  name: string
  description: string
  kind: SchemaKind
  jsonSchema: any
}

export function useGetSchemas(kind?: string) {
  const { data, error, mutate } = useSWR<
    {
      schemas: SchemaInterface[]
    },
    ErrorInfo
  >(kind ? `/api/v2/schemas?kind=${kind}` : '/api/v2/schemas/', fetcher)

  return {
    mutateSchemas: mutate,
    schemas: data ? data.schemas : [],
    isSchemasLoading: !error && !data,
    isSchemasError: error,
  }
}

export function useGetSchema(id: string) {
  const { data, error, mutate } = useSWR<
    {
      schema: SchemaInterface
    },
    ErrorInfo
  >(id ? `/api/v2/schema/${id}` : null, fetcher)

  return {
    mutateSchema: mutate,
    schema: data ? data.schema : undefined,
    isSchemaLoading: !error && !data,
    isSchemaError: error,
  }
}

export async function postSchema(data: PostSchemaParams) {
  return fetch('/api/v2/schemas', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function putSchema(schema: SchemaInterface) {
  return fetch(`/api/v2/schema/${schema.id}`, {
    method: 'put',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schema),
  })
}

export async function deleteSchema(schemaId: string) {
  return fetch(`/api/v2/schema/${schemaId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
}
