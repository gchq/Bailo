import Close from '@mui/icons-material/Close'
import Info from '@mui/icons-material/Info'
import Save from '@mui/icons-material/Save'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetSchema } from 'actions/schema'
import { KeyedMutator } from 'node_modules/swr/dist/index/index.mjs'
import { useContext, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import MessageAlert from 'src/MessageAlert'
import InformationDialog from 'src/schemas/InformationDialog'
import { DeploymentAssessmentInterface, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema, removeEmptyValues } from 'utils/formUtils'

type EditableDeploymentAssessmentFormProps = {
  deploymentAssessment: DeploymentAssessmentInterface
  mutate: KeyedMutator<{
    deploymentAssessment: DeploymentAssessmentInterface
  }>
  isEdit: boolean
  onIsEditChange: (value: boolean) => void
  readOnly?: boolean
}

export default function EditableDeploymentAssessmentForm({
  deploymentAssessment,
  mutate,
  isEdit,
  onIsEditChange,
  readOnly = false,
}: EditableDeploymentAssessmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, _setDeleteErrorMessage] = useState('')
  const [schemaInformationOpen, setSchemaInformationOpen] = useState(false)

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(deploymentAssessment.schemaId)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({
    reference: '',
    steps: [],
  })

  useEffect(() => {
    if (!schema || isEdit) {
      return
    }

    const steps = getStepsFromSchema(schema, {}, [], deploymentAssessment.metadata)

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, deploymentAssessment.metadata, isEdit])

  async function handleSubmit() {
    if (schema) {
      setErrorMessage('')
      setIsLoading(true)

      const response = await patchDeploymentAssessment(
        deploymentAssessment.id,
        removeEmptyValues(deploymentAssessment.metadata),
        deploymentAssessment.draft,
      )

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response))
      } else {
        mutate()
        onIsEditChange(false)
      }
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    if (schema) {
      const steps = getStepsFromSchema(schema, {}, [], deploymentAssessment.metadata)
      for (const step of steps) {
        step.steps = steps
      }
      setSplitSchema({ reference: schema.id, steps })
    }
  }

  function handleEdit() {
    onIsEditChange(true)
  }

  function handleCancel() {
    onIsEditChange(false)
    resetForm()
  }

  function handleDelete() {
    setOpen(true)
  }

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  const formHeading = useMemo(
    () => (
      <>
        {schema && (
          <Stack>
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
            >
              Schema
            </Typography>
            <Stack
              direction='row'
              sx={{
                alignItems: 'center',
              }}
            >
              <Typography>{schema?.name}</Typography>
              <IconButton onClick={() => setSchemaInformationOpen(true)}>
                <Info color='primary' fontSize='small' />
              </IconButton>
              <InformationDialog
                open={schemaInformationOpen}
                schema={schema}
                onClose={() => setSchemaInformationOpen(false)}
              />
            </Stack>
            <Stack>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Created by</Typography>
              <UserDisplay dn={deploymentAssessment.createdBy} />
            </Stack>
          </Stack>
        )}
      </>
    ),
    [deploymentAssessment.createdBy, schema, schemaInformationOpen],
  )

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  return (
    <>
      {isSchemaLoading && <Loading />}
      <Box sx={{ py: 1 }}>
        <EditableFormHeading
          heading={formHeading}
          editAction='editDeploymentAssessment'
          deleteAction='deleteDeploymentAssessment'
          editButtonText='Edit Deployment Assessment'
          deleteButtonText='Delete Deployment Assessment'
          isEdit={isEdit}
          isLoading={isLoading}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          errorMessage={errorMessage}
          readOnly={readOnly}
        />
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
        <ConfirmationDialogue
          open={open}
          title='Delete Deployment Assessment'
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          errorMessage={deleteErrorMessage}
          dialogMessage={'Are you sure you want to delete this deployment assessment?'}
        />
        {isEdit && (
          <Stack
            direction='row'
            spacing={1}
            sx={{
              justifyContent: 'flex-end',
              alignItems: 'center',
              mb: { xs: 2 },
            }}
          >
            <Button variant='outlined' onClick={handleCancel} startIcon={<Close />}>
              Cancel
            </Button>
            <Button variant='contained' loading={isLoading} onClick={handleSubmit} startIcon={<Save />}>
              Save
            </Button>
          </Stack>
        )}
      </Box>
    </>
  )
}
