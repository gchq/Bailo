import qs from 'querystring'
import useSWR from 'swr'

import { SchemaInterface, SchemaKindKeys } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

const emptySchemaList = []

export interface PostSchemaParams {
  id: string
  name: string
  description: string
  kind: SchemaKindKeys
  jsonSchema: any
  reviewRoles?: string[]
}

export function useGetSchemas(kind: SchemaKindKeys, hidden?: boolean) {
  const queryParams = {
    kind,
    ...(hidden != undefined && { hidden }),
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      schemas: SchemaInterface[]
    },
    ErrorInfo
  >(`/api/v2/schemas?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateSchemas: mutate,
    schemas: data ? data.schemas : emptySchemaList,
    isSchemasLoading: isLoading,
    isSchemasError: error,
  }
}

export function useGetSchema(id: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      schema: SchemaInterface
    },
    ErrorInfo
  >(id ? `/api/v2/schema/${id}` : null, fetcher)

  return {
    mutateSchema: mutate,
    schema: data ? data.schema : undefined,
    isSchemaLoading: isLoading,
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

export async function patchSchema(schemaId: string, diff: Partial<SchemaInterface>) {
  return fetch(`/api/v2/schema/${schemaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(diff),
  })
}

export async function deleteSchema(schemaId: string) {
  return fetch(`/api/v2/schema/${schemaId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
}
