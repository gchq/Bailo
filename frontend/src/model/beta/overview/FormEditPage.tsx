import { LoadingButton } from '@mui/lab'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useContext, useEffect, useState } from 'react'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'

import { useGetModel } from '../../../../actions/model'
import { putModelCard, useGetModelCardRevisions } from '../../../../actions/modelCard'
import { useGetSchema } from '../../../../actions/schema'
import { useGetUiConfig } from '../../../../actions/uiConfig'
import { SplitSchemaNoRender } from '../../../../types/interfaces'
import { ModelInterface } from '../../../../types/v2/types'
import { getStepsData, getStepsFromSchema } from '../../../../utils/beta/formUtils'
import Loading from '../../../common/Loading'
import JsonSchemaForm from '../../../Form/beta/JsonSchemaForm'
import MessageAlert from '../../../MessageAlert'
import ModelCardHistoryDialog from '../overview/ModelCardHistoryDialog'

type FormEditPageProps = {
  model: ModelInterface
}

export default function FormEditPage({ model }: FormEditPageProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model.card.schemaId)
  const { isModelError, mutateModel } = useGetModel(model.id)
  const { mutateModelCardRevisions } = useGetModelCardRevisions(model.id)
  const { uiConfig: _uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  async function onSubmit() {
    if (schema) {
      setLoading(true)
      const data = getStepsData(splitSchema, true)
      const res = await putModelCard(model.id, data)
      if (res.status && res.status < 400) {
        setIsEdit(false)
        mutateModelCardRevisions()
      }
      setLoading(false)
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
      setIsEdit(false)
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

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

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
    <>
      {(isSchemaLoading || isUiConfigLoading) && <Loading />}
      <Box sx={{ py: 1 }}>
        <Stack
          direction={{ sx: 'column', sm: 'row' }}
          justifyContent={{ sx: 'center', sm: 'space-between' }}
          alignItems='center'
          sx={{ pb: 2 }}
        >
          <div>
            <Typography fontWeight='bold'>Schema</Typography>
            <Typography>{schema?.name}</Typography>
          </div>
          {!isEdit && (
            <Stack
              direction='row'
              spacing={1}
              justifyContent='flex-end'
              divider={<Divider orientation='vertical' flexItem />}
              sx={{ mb: { xs: 2 } }}
            >
              <Button variant='outlined' onClick={() => setDialogOpen(true)}>
                View History
              </Button>
              <Button
                variant='outlined'
                onClick={() => setIsEdit(!isEdit)}
                sx={{ mb: { xs: 2 } }}
                data-test='editModelCardButton'
              >
                Edit Model card
              </Button>
            </Stack>
          )}
          {isEdit && (
            <Stack
              direction='row'
              spacing={1}
              justifyContent='flex-end'
              divider={<Divider orientation='vertical' flexItem />}
              sx={{ mb: { xs: 2 } }}
            >
              <Button variant='outlined' onClick={onCancel} data-test='cancelEditModelCardButton'>
                Cancel
              </Button>
              <LoadingButton variant='contained' onClick={onSubmit} loading={loading} data-test='saveModelCardButton'>
                Save
              </LoadingButton>
            </Stack>
          )}
        </Stack>
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
      </Box>
      <ModelCardHistoryDialog model={model} open={dialogOpen} setOpen={setDialogOpen} />
    </>
  )
}
