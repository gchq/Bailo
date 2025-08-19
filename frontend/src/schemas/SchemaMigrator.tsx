import { Stack, Typography } from '@mui/material'
import schema from 'pages/data-card/[dataCardId]/schema'
import { useEffect, useState } from 'react'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import { SchemaInterface, SplitSchemaNoRender } from 'types/types'
import { getStepsFromSchema } from 'utils/formUtils'

interface SchemaMigratorProps {
  sourceSchema: SchemaInterface | undefined
  targetSchema: SchemaInterface | undefined
}
export default function SchemaMigrator({ sourceSchema, targetSchema }: SchemaMigratorProps) {
  const [splitSourceSchema, setSplitSourceSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [splitTargetSchema, setSplitTargetSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  useEffect(() => {
    if (!sourceSchema || !targetSchema) return
    const sourceSteps = getStepsFromSchema(sourceSchema, {}, ['properties.contacts'])
    const targetSteps = getStepsFromSchema(targetSchema, {}, ['properties.contacts'])

    for (const step of sourceSteps) {
      step.steps = sourceSteps
    }
    setSplitSourceSchema({ reference: sourceSchema.id, steps: sourceSteps })

    for (const step of targetSteps) {
      step.steps = targetSteps
    }
    setSplitSourceSchema({ reference: targetSchema.id, steps: targetSteps })
  }, [schema, sourceSchema, targetSchema])

  return (
    <Stack direction='row'>
      {sourceSchema ? (
        <JsonSchemaForm splitSchema={splitSourceSchema} setSplitSchema={setSplitSourceSchema} />
      ) : (
        <Typography>No valid source schema</Typography>
      )}
    </Stack>
  )
}
