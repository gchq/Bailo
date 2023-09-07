import { Box, Button, Divider, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetModel } from '../../../../actions/model'
import { putModelCard } from '../../../../actions/modelCard'
import { useGetSchema } from '../../../../actions/schema'
import { useGetUiConfig } from '../../../../actions/uiConfig'
import { SplitSchemaNoRender } from '../../../../types/interfaces'
import { ModelInterface } from '../../../../types/v2/types'
import { getStepsData, getStepsFromSchema } from '../../../../utils/beta/formUtils'
import Loading from '../../../common/Loading'
import ModelCardForm from '../../../Form/beta/ModelCardForm'
import MessageAlert from '../../../MessageAlert'

type FormEditPageProps = {
  model: ModelInterface
}

export default function FormEditPage({ model }: FormEditPageProps) {
  const [isEdit, setIsEdit] = useState(false)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model.card.schemaId)
  const { mutateModel } = useGetModel(model.id)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const { uiConfig: _uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  async function onSubmit() {
    if (schema) {
      const data = getStepsData(splitSchema, true)
      data.schemaRef = schema.id
      const res = await putModelCard(model.id, data)
      if (res.status && res.status < 400) {
        setIsEdit(false)
      }
    }
  }

  function onCancel() {
    if (schema) {
      mutateModel()
      const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], model.card.metadata)
      for (const step of steps) {
        step.steps = steps
      }
      setSplitSchema({ reference: schema.id, steps })
      setIsEdit(!isEdit)
    }
  }

  useEffect(() => {
    if (!model || !schema) return
    const metadata = model.card.metadata
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
  return (
    <>
      {(isSchemaLoading || isUiConfigLoading) && <Loading />}
      <Box sx={{ px: 4, py: 1 }}>
        {!isEdit && (
          <Box sx={{ width: '100%', textAlign: 'right' }}>
            <Button variant='outlined' onClick={() => setIsEdit(!isEdit)}>
              Edit Model card
            </Button>
          </Box>
        )}
        {isEdit && (
          <Stack
            direction='row'
            spacing={1}
            justifyContent='flex-end'
            divider={<Divider orientation='vertical' flexItem />}
          >
            <Button variant='outlined' onClick={onCancel}>
              Cancel
            </Button>
            <Button variant='contained' onClick={onSubmit}>
              Save
            </Button>
          </Stack>
        )}
        <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
      </Box>
    </>
  )
}
