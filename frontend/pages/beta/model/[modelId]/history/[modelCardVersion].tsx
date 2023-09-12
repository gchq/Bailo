import { Box } from '@mui/material'
import { useEffect, useState } from 'react'

import ModelCardForm from '../../../../../../frontend/src/Form/beta/ModelCardForm'
import { useGetSchema } from '../../../../../actions/schema'
import { useGetUiConfig } from '../../../../../actions/uiConfig'
import Loading from '../../../../../src/common/Loading'
import MessageAlert from '../../../../../src/MessageAlert'
import { ReleaseInterface } from '../../../../../types/types'

type ModelCardVersionProps = {
  version: ReleaseInterface
}

export default function viewModelCardVersion({ version }: ModelCardVersionProps) {
  const [isEdit, setIsEdit] = useState(true)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(version)
  const { uiConfig: _uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

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
        <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={!isEdit} />
      </Box>
    </>
  )
}
