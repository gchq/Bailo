import { Box, Button } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetSchema } from '../../../../actions/schema'
import { useGetUiConfig } from '../../../../actions/uiConfig'
import { SplitSchema } from '../../../../types/interfaces'
import { ModelInterface } from '../../../../types/v2/types'
import { createStep, getStepsFromSchema } from '../../../../utils/formUtilsBeta'
import Loading from '../../../common/Loading'
import Form from '../../../Form/FormBeta'
import RenderFileTab, { fileTabComplete, RenderBasicFileTab } from '../../../Form/RenderFileTab'
import MessageAlert from '../../../MessageAlert'

type FormEditPageProps = {
  model: ModelInterface
}

export default function FormEditPage({ model }: FormEditPageProps) {
  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [isEdit, setIsEdit] = useState(false)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model.schema)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  async function onSubmit() {
    console.log(splitSchema)
  }

  useEffect(() => {
    if (!model || !schema) return

    const steps = getStepsFromSchema(
      schema,
      {
        buildOptions: {
          seldonVersion: { 'ui:widget': 'seldonVersionSelector' },
        },
      },
      []
    )

    steps.push(
      createStep({
        schema: {
          title: 'Files',
        },
        state: {
          binary: undefined,
          code: undefined,
        },
        schemaRef: schema.id,

        type: 'Data',
        index: steps.length,
        section: 'files',

        render: RenderFileTab,
        renderBasic: RenderBasicFileTab,
        isComplete: (step) => fileTabComplete(step, uiConfig ? uiConfig.maxModelSizeGB : 0),
      })
    )

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
      <Box sx={{ textAlign: 'right', width: '100%' }}>
        <Button variant='outlined' onClick={() => setIsEdit(!isEdit)}>
          {isEdit ? 'View model card' : 'Edit model card'}
        </Button>
      </Box>
      <Form splitSchema={splitSchema} setSplitSchema={setSplitSchema} onSubmit={onSubmit} canEdit={isEdit} />
    </>
  )
}
