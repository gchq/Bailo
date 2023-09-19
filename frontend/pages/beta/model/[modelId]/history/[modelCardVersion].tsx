import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { Box, Button, Card, Container } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useModelCard } from '../../../../../actions/modelCard'
import { useGetSchema } from '../../../../../actions/schema'
import { useGetUiConfig } from '../../../../../actions/uiConfig'
import Loading from '../../../../../src/common/Loading'
import ModelCardForm from '../../../../../src/Form/beta/ModelCardForm'
import MessageAlert from '../../../../../src/MessageAlert'
import Wrapper from '../../../../../src/Wrapper.beta'
import { SplitSchemaNoRender } from '../../../../../types/interfaces'
import { getStepsFromSchema } from '../../../../../utils/beta/formUtils'

export default function ViewModelCardVersion() {
  const router = useRouter()
  const { modelId, modelCardVersion }: { modelId?: string; modelCardVersion?: number } = router.query

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const { model, isModelLoading, isModelError } = useModelCard(modelId, modelCardVersion)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaId || '')
  const { uiConfig: _uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  useEffect(() => {
    if (!model || !schema) return
    const metadata = model.metadata
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], metadata)

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model])

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <Wrapper title='Modelcard Revision' page='modelcard'>
      {(isSchemaLoading || isUiConfigLoading || isModelLoading) && <Loading />}
      <Box sx={{ px: 4, py: 1 }}>
        {!isSchemaLoading && !isUiConfigLoading && (
          <Container>
            <Card sx={{ p: 4 }}>
              <Button startIcon={<ArrowBackIosIcon />} onClick={() => router.push(`/beta/model/${modelId}`)}>
                Back To Model
              </Button>
              <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
            </Card>
          </Container>
        )}
      </Box>
    </Wrapper>
  )
}
