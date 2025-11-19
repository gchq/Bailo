import qs from 'querystring'
import useSWR from 'swr'
import { QuestionMigration, SchemaMigrationInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

interface PostSchemaMigrationParams {
  name: string
  description?: string

  sourceSchema: string
  targetSchema: string

  draft: boolean

  questionMigrations: QuestionMigration[]
}

export async function postSchemaMigration(data: PostSchemaMigrationParams) {
  return fetch('/api/v2/schema-migration', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function putSchemaMigration(
  schemaMigrationId: string,
  planDiff: Pick<SchemaMigrationInterface, 'name' | 'description' | 'questionMigrations' | 'draft'>,
) {
  return fetch(`/api/v2/schema-migration/${schemaMigrationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planDiff),
  })
}

export function useGetSchemaMigrations(sourceSchema?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      schemaMigrations: SchemaMigrationInterface[]
    },
    ErrorInfo
  >(`/api/v2/schema-migrations?${qs.stringify({ sourceSchema })}`, fetcher)

  return {
    mutateSchemas: mutate,
    schemaMigrations: data ? data.schemaMigrations : [],
    isSchemaMigrationsLoading: isLoading,
    isSchemaMigrationsError: error,
  }
}

export function useGetSchemaMigration(schemaMigrationId: string) {
  const { data, isLoading, error, mutate } = useSWR<{ schemaMigration: SchemaMigrationInterface }, ErrorInfo>(
    `/api/v2/schema-migration/${schemaMigrationId}`,
    fetcher,
  )

  return {
    mutateSchemas: mutate,
    schemaMigration: data?.schemaMigration,
    isSchemaMigrationLoading: isLoading,
    isSchemaMigrationError: error,
  }
}

export function postRunSchemaMigration(modelId: string, migrationId: string) {
  return fetch(`/api/v2/model/${modelId}/migrate-schema/${migrationId}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
  })
}
