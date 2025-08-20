import { Grid2, Stack, Typography } from '@mui/material'
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
    const sourceSteps = getStepsFromSchema(sourceSchema, {}, [])
    const targetSteps = getStepsFromSchema(targetSchema, {}, [])

    for (const step of sourceSteps) {
      step.steps = sourceSteps
    }
    setSplitSourceSchema({ reference: sourceSchema.id, steps: sourceSteps })

    for (const step of targetSteps) {
      step.steps = targetSteps
    }
    setSplitTargetSchema({ reference: targetSchema.id, steps: targetSteps })
  }, [schema, sourceSchema, targetSchema])

  console.log(splitSourceSchema)

  return (
    <Grid2 container spacing={2}>
      {sourceSchema ? (
        <Grid2 size={{ sm: 12, md: 6 }}>
          <Stack spacing={2}>
            <Typography>Source Schema</Typography>
            <JsonSchemaForm splitSchema={splitSourceSchema} setSplitSchema={setSplitSourceSchema} hideInputs />
          </Stack>
        </Grid2>
      ) : (
        <Typography>No valid source schema</Typography>
      )}
      {targetSchema ? (
        <Grid2 size={{ sm: 12, md: 6 }}>
          <Stack spacing={2}>
            <Typography>Target Schema</Typography>
            <JsonSchemaForm splitSchema={splitTargetSchema} setSplitSchema={setSplitTargetSchema} hideInputs />
          </Stack>
        </Grid2>
      ) : (
        <Typography>No valid target schema</Typography>
      )}
    </Grid2>
  )
}
