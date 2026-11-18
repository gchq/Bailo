import { useGetSchemas } from 'actions/schema'
import { SchemaKind } from 'types/types'

export const noDeploymentAssessmentSchemasMessage =
  'No Deployment Assessment schemas are available. Contact an administrator to add one.'

export default function useDeploymentAssessmentSchemaAvailability() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.DEPLOYMENT_ASSESSMENT, false)

  const noSchemasAvailable = !isSchemasLoading && !isSchemasError && schemas.length === 0

  return { isSchemasLoading, noSchemasAvailable }
}
