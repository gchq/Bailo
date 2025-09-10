import { QuestionMigration } from 'types/types'

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
