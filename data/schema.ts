import qs from 'qs'
import useSWR from 'swr'
import { Schema } from '../types/interfaces'
import { fetcher } from '../utils/fetcher'

export function useGetDefaultSchema(use = 'UPLOAD') {
  const { data, error, mutate } = useSWR<Schema>(
    `/api/v1/schema/default?${qs.stringify({
      use,
    })}`,
    fetcher
  )

  return {
    mutateDefaultSchema: mutate,
    defaultSchema: data,
    isDefaultSchemaLoading: !error && !data,
    isDefaultSchemaError: error,
  }
}

type SchemaUse = 'UPLOAD' | 'DEPLOYMENT'
export function useGetSchemas(use: SchemaUse) {
  const { data, error, mutate } = useSWR<Array<Schema>>(
    `/api/v1/schemas?${qs.stringify({
      use,
    })}`,
    fetcher
  )

  return {
    mutateSchemas: mutate,
    schemas: data,
    isSchemasLoading: !error && !data,
    isSchemasError: error,
  }
}

export function useGetSchema(schemaRef?: string) {
  const { data, error, mutate } = useSWR<Schema>(
    schemaRef ? `/api/v1/schema/${encodeURIComponent(schemaRef)}` : null,
    fetcher
  )

  return {
    mutateSchema: mutate,
    schema: data,
    isSchemaLoading: !error && !data,
    isSchemaError: error,
  }
}
