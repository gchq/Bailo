import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { Button, Card, Container } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import { EntryCardInterface, EntryKindKeys, EntryKindLabel, SchemaInterface, SplitSchemaNoRender } from 'types/types'
import { getStepsFromSchema } from 'utils/formUtils'

type EntryCardVersionProps = {
  entryCard: EntryCardInterface
  schema: SchemaInterface
  entryId: string
  entryKind: EntryKindKeys
}

export default function EntryCardVersion({ entryCard, schema, entryId, entryKind }: EntryCardVersionProps) {
  const router = useRouter()
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  useEffect(() => {
    if (!entryCard || !schema) return
    const metadata = entryCard.metadata
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], metadata)

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, entryCard])

  return (
    <Container>
      <Card sx={{ p: 4, my: 4 }}>
        <Button startIcon={<ArrowBackIosIcon />} onClick={() => router.push(`/${entryKind}/${entryId}`)}>
          {`Back to ${EntryKindLabel[entryKind]}`}
        </Button>
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
      </Card>
    </Container>
  )
}
