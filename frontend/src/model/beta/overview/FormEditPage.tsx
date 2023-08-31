import { Box, Button, Divider, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

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
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model.schema)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const { uiConfig: _uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  function onSubmit() {
    if (schema) {
      const data = getStepsData(splitSchema, true)
      data.schemaRef = schema.id
      const form = JSON.stringify(data)
      // TODO - submit form
      console.log(form)
    }
  }

  useEffect(() => {
    if (!model || !schema) return

    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'])

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema])

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }
  return (
    <>
      {isSchemaLoading || (isUiConfigLoading && <Loading />)}
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
            <Button variant='outlined' onClick={() => setIsEdit(!isEdit)}>
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
