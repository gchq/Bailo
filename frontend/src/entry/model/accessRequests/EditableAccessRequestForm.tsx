import { LoadingButton } from '@mui/lab'
import { Box, Button, Stack, Typography } from '@mui/material'
import {
  deleteAccessRequest,
  patchAccessRequest,
  useGetAccessRequest,
  useGetAccessRequestsForModelId,
} from 'actions/accessRequest'
import { useGetModel } from 'actions/model'
import { useGetSchema } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import MessageAlert from 'src/MessageAlert'
import { AccessRequestInterface, EntryKind, SplitSchemaNoRender } from 'types/types'
import { entitiesIncludesCurrentUser } from 'utils/entityUtils'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema } from 'utils/formUtils'
import { getCurrentUserRoles, hasRole } from 'utils/roles'

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
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(accessRequest.schemaId)
  const { isAccessRequestError, mutateAccessRequest } = useGetAccessRequest(accessRequest.modelId, accessRequest.id)
  const { mutateAccessRequests } = useGetAccessRequestsForModelId(accessRequest.modelId)
  const { model, isModelLoading, isModelError } = useGetModel(accessRequest.modelId, EntryKind.MODEL)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const router = useRouter()

  const currentUserRoles = useMemo(() => getCurrentUserRoles(model, currentUser), [model, currentUser])

  const [canUserEditOrDelete, actionButtonsTooltip] = useMemo(() => {
    const isUserOwner = hasRole(currentUserRoles, ['owner'])
    const isUserNamedInAccessRequest = entitiesIncludesCurrentUser(
      accessRequest.metadata.overview.entities,
      currentUser,
    )
    const actionButtonsTooltip = !(isUserOwner || isUserNamedInAccessRequest)
      ? 'Only model owners or additional contacts can edit/delete an Access Request'
      : ''

    return [isUserOwner || isUserNamedInAccessRequest, actionButtonsTooltip]
  }, [accessRequest.metadata.overview.entities, currentUser, currentUserRoles])

  const handleDeleteConfirm = useCallback(async () => {
    setErrorMessage('')
    const res = await deleteAccessRequest(accessRequest.modelId, accessRequest.id)
    if (!res.ok) {
      setDeleteErrorMessage(await getErrorMessage(res))
    } else {
      mutateAccessRequests()
      setOpen(false)
      router.push(`/model/${accessRequest.modelId}?tab=access`)
    }
  }, [mutateAccessRequests, accessRequest, router])

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

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {(isSchemaLoading || isModelLoading || isCurrentUserLoading) && <Loading />}
      <Box sx={{ py: 1 }}>
        <EditableFormHeading
          heading={
            <div>
              <Typography fontWeight='bold'>Schema</Typography>
              <Stack direction='row' alignItems='center'>
                <Typography>{schema?.name}</Typography>
                <CopyToClipboardButton
                  textToCopy={schema ? schema.name : ''}
                  notificationText='Copied schema name to clipboard'
                  ariaLabel='copy schema name to clipboard'
                />
              </Stack>
            </div>
          }
          editButtonText='Edit Access Request'
          deleteButtonText='Delete Request'
          canUserEditOrDelete={canUserEditOrDelete}
          actionButtonsTooltip={actionButtonsTooltip}
          isEdit={isEdit}
          isLoading={isLoading}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          onDelete={() => setOpen(true)}
          errorMessage={errorMessage}
          showDeleteButton
        />
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
        <ConfirmationDialogue
          open={open}
          title='Delete Access Request'
          onConfirm={handleDeleteConfirm}
          onCancel={() => setOpen(false)}
          errorMessage={deleteErrorMessage}
          dialogMessage={'Are you sure you want to delete this access request?'}
        />
        {isEdit && (
          <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center' sx={{ mb: { xs: 2 } }}>
            <Button variant='outlined' onClick={handleCancel}>
              Cancel
            </Button>
            <LoadingButton variant='contained' loading={isLoading} onClick={handleSubmit}>
              Save
            </LoadingButton>
          </Stack>
        )}
      </Box>
    </>
  )
}
