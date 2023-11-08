import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchAccessRequest, useGetAccessRequest } from 'actions/accessRequest'
import { useCallback, useContext, useEffect, useState } from 'react'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import { getErrorMessage } from 'utils/fetcher'

import { useGetSchema } from '../../../../actions/schema'
import { useGetUiConfig } from '../../../../actions/uiConfig'
import { AccessRequestInterface, SplitSchemaNoRender } from '../../../../types/interfaces'
import { getStepsData, getStepsFromSchema } from '../../../../utils/beta/formUtils'
import Loading from '../../../common/Loading'
import ModelCardForm from '../../../Form/beta/JsonSchemaForm'
import MessageAlert from '../../../MessageAlert'

type EditableAccessRequestFormProps = {
  accessRequest: AccessRequestInterface
}

export default function EditableAccessRequestForm({ accessRequest }: EditableAccessRequestFormProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorText, setErrorText] = useState('')

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(accessRequest.schemaId)
  const { mutateAccessRequest } = useGetAccessRequest(accessRequest.modelId, accessRequest.id)
  const { uiConfig: _uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const theme = useTheme()

  async function handleSubmit() {
    if (schema) {
      const data = getStepsData(splitSchema, true)
      const res = await patchAccessRequest(accessRequest.modelId, accessRequest.id, data)
      if (!res.ok) {
        setErrorText(await getErrorMessage(res))
      } else {
        setIsEdit(false)
        setErrorText('')
        mutateAccessRequest()
      }
    }
  }

  const resetForm = useCallback(() => {
    if (schema) {
      const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], accessRequest.metadata)
      for (const step of steps) {
        step.steps = steps
      }
      setSplitSchema({ reference: schema.id, steps })
    }
  }, [accessRequest.metadata, schema])

  function handleCancel() {
    setIsEdit(false)
    resetForm()
  }

  useEffect(() => {
    resetForm()
  }, [resetForm])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
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
          spacing={2}
        >
          <div>
            <Typography fontWeight='bold'>Schema</Typography>
            <Typography>{schema?.name}</Typography>
          </div>
          {!isEdit && (
            <Button variant='outlined' onClick={() => setIsEdit(!isEdit)} sx={{ mb: { xs: 2 } }}>
              Edit Access Request
            </Button>
          )}
          {isEdit && (
            <Stack>
              <Stack
                direction='row'
                spacing={1}
                justifyContent='flex-end'
                divider={<Divider orientation='vertical' flexItem />}
                sx={{ mb: { xs: 2 } }}
              >
                <Button variant='outlined' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant='contained' onClick={handleSubmit}>
                  Save
                </Button>
              </Stack>
              <Typography variant='caption' color={theme.palette.error.main}>
                {errorText}
              </Typography>
            </Stack>
          )}
        </Stack>
        <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
      </Box>
    </>
  )
}
