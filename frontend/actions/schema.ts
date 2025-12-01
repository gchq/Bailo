import { EntrySearchResult } from 'actions/model'
import qs from 'querystring'
import useSWR from 'swr'

import { AccessRequestInterface, EntryKind, SchemaInterface, SchemaKind, SchemaKindKeys } from '../types/types'
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

export function useGetSchemas(kind?: SchemaKindKeys, hidden?: boolean) {
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

export function useGetUsageBySchema(kind: SchemaKindKeys, schemaId: string) {
  const queryParams = {
    schemaId,
    adminAccess: true,
    ...(kind !== SchemaKind.ACCESS_REQUEST && {
      kind: kind === SchemaKind.DATA_CARD ? EntryKind.DATA_CARD : EntryKind.MODEL,
    }),
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      accessRequests: AccessRequestInterface[]
      models: EntrySearchResult[]
    },
    ErrorInfo
  >(
    kind === SchemaKind.ACCESS_REQUEST
      ? `/api/v2/access-requests/search?${qs.stringify(queryParams)}`
      : `/api/v2/models/search?${qs.stringify(queryParams)}`,
    fetcher,
  )

  if (kind === SchemaKind.ACCESS_REQUEST) {
    return {
      mutateData: mutate,
      data: data
        ? data.accessRequests.map((accessRequest) => ({
            id: accessRequest.id,
            name: accessRequest.metadata.overview.name,
            description: accessRequest.modelId,
            href: `/model/${accessRequest.modelId}/access-request/${accessRequest.id}`,
          }))
        : emptySchemaList,
      isDataLoading: isLoading,
      isDataError: error,
    }
  } else {
    return {
      mutateData: mutate,
      data: data
        ? data.models.map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.description,
            href: `/model/${entry.id}`,
          }))
        : emptySchemaList,
      isDataLoading: isLoading,
      isDataError: error,
    }
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
