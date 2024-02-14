import { Box, Typography } from '@mui/material'
import { patchAccessRequest, useGetAccessRequest } from 'actions/accessRequest'
import { useCallback, useContext, useEffect, useState } from 'react'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import { getErrorMessage } from 'utils/fetcher'

import { useGetSchema } from '../../../actions/schema'
import { AccessRequestInterface, SplitSchemaNoRender } from '../../../types/interfaces'
import { getStepsData, getStepsFromSchema } from '../../../utils/formUtils'
import Loading from '../../common/Loading'
import JsonSchemaForm from '../../Form/JsonSchemaForm'
import MessageAlert from '../../MessageAlert'

type EditableAccessRequestFormProps = {
  accessRequest: AccessRequestInterface
  isEdit: boolean
  onIsEditChange: (value: boolean) => void
}

export default function EditableAccessRequestForm({
  accessRequest,
  isEdit,
  onIsEditChange,
}: EditableAccessRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorMessage, setErrorMessage] = useState('')

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(accessRequest.schemaId)
  const { isAccessRequestError, mutateAccessRequest } = useGetAccessRequest(accessRequest.modelId, accessRequest.id)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  async function handleSubmit() {
    if (schema) {
      setErrorMessage('')
      setIsLoading(true)
      const data = getStepsData(splitSchema, true)
      const res = await patchAccessRequest(accessRequest.modelId, accessRequest.id, data)
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        onIsEditChange(false)
        mutateAccessRequest()
      }
      setIsLoading(false)
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

  function handleEdit() {
    onIsEditChange(true)
  }

  function handleCancel() {
    onIsEditChange(false)
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

  if (isAccessRequestError) {
    return <MessageAlert message={isAccessRequestError.info.message} severity='error' />
  }

  return (
    <>
      {isSchemaLoading && <Loading />}
      <Box sx={{ py: 1 }}>
        <EditableFormHeading
          heading={
            <div>
              <Typography fontWeight='bold'>Schema</Typography>
              <Typography>{schema?.name}</Typography>
            </div>
          }
          editButtonText='Edit Access Request'
          isEdit={isEdit}
          isLoading={isLoading}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          errorMessage={errorMessage}
        />
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
      </Box>
    </>
  )
}
