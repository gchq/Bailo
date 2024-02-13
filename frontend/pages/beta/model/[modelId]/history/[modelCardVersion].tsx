import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { Box, Button, Card, Container } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'

import { useModelCard } from '../../../../../actions/modelCard'
import { useGetSchema } from '../../../../../actions/schema'
import Loading from '../../../../../src/common/Loading'
import JsonSchemaForm from '../../../../../src/Form/JsonSchemaForm'
import Wrapper from '../../../../../src/Wrapper.beta'
import { SplitSchemaNoRender } from '../../../../../types/interfaces'
import { getStepsFromSchema } from '../../../../../utils/formUtils'

export default function ViewModelCardVersion() {
  const router = useRouter()
  const { modelId, modelCardVersion }: { modelId?: string; modelCardVersion?: number } = router.query

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const { model, isModelLoading, isModelError } = useModelCard(modelId, modelCardVersion)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaId || '')

  useEffect(() => {
    if (!model || !schema) return
    const metadata = model.metadata
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], metadata)

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model])

  const error = MultipleErrorWrapper(`Unable to load history page`, {
    isSchemaError,
    isModelError,
  })
  if (error) return error

  return (
    <Wrapper title='Model Card Revision' page='Model'>
      {(isSchemaLoading || isModelLoading) && <Loading />}
      <Box sx={{ px: 4, py: 1 }}>
        {!isSchemaLoading && (
          <Container>
            <Card sx={{ p: 4 }}>
              <Button startIcon={<ArrowBackIosIcon />} onClick={() => router.push(`/beta/model/${modelId}`)}>
                Back To Model
              </Button>
              <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
            </Card>
          </Container>
        )}
      </Box>
    </Wrapper>
  )
}
