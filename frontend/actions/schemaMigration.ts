import qs from 'querystring'
import useSWR from 'swr'
import { QuestionMigration, SchemaMigrationInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

interface PostSchemaMigrationParams {
  name: string
  description?: string

  sourceSchema: string
  targetSchema: string

  questionMigrations: QuestionMigration[]
}

export async function postSchemaMigration(data: PostSchemaMigrationParams) {
  return fetch('/api/v2/schema-migration', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function useGetSchemaMigrations(name?: string) {
  const queryParams = {
    name,
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      schemaMigrations: SchemaMigrationInterface[]
    },
    ErrorInfo
  >(`/api/v2/schema-migrations?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateSchemas: mutate,
    schemaMigrations: data ? data.schemaMigrations : [],
    isSchemaMigrationsLoading: isLoading,
    isSchemaMigrationsError: error,
  }
}
