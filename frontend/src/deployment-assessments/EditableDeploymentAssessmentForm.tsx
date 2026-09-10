import Close from '@mui/icons-material/Close'
import Save from '@mui/icons-material/Save'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { getChangedFields } from '@rjsf/utils'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { deleteDeploymentAssessment } from 'actions/deploymentAssessments'
import { useGetSchema } from 'actions/schema'
import cloneDeep from 'lodash-es/cloneDeep'
import { useContext, useEffect, useMemo, useState } from 'react'
import DeletionConfirmationDialogue from 'src/common/DeletionConfirmationDialogue'
import LabelledInput from 'src/common/LabelledInput'
import LabelledValue from 'src/common/LabelledValue'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import MessageAlert from 'src/MessageAlert'
import { KeyedMutator } from 'swr'
import { DeploymentAssessmentInterface, DeploymentAssessmentStateKeys, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema, removeEmptyValues, validateForm } from 'utils/formUtils'

type EditableDeploymentAssessmentFormProps = {
  deploymentAssessment: DeploymentAssessmentInterface
  mutate: KeyedMutator<{
    deploymentAssessment: DeploymentAssessmentInterface
    state: DeploymentAssessmentStateKeys
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
  const [originalSplitSchema, setOriginalSplitSchema] = useState<SplitSchemaNoRender>({
    reference: '',
    steps: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState(deploymentAssessment.name)

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

      const oldData = getStepsData(originalSplitSchema, true)
      const data = getStepsData(splitSchema, true)

      const answersChanged = getChangedFields(oldData, data).length > 0
      const nameChanged = deploymentAssessment.name !== newName
      const nothingChanged = !answersChanged && !nameChanged

      if (nothingChanged) {
        setIsLoading(false)
        onIsEditChange(false)
        return
      }

      if (!deploymentAssessment.draft) {
        for (const step of splitSchema.steps) {
          const isValid = validateForm(step)

          if (!isValid) {
            setErrorMessage('Please make sure that all sections have been completed.')
            setIsLoading(false)
            return
          }
        }
      }

      const response = await patchDeploymentAssessment(
        deploymentAssessment.id,
        answersChanged ? removeEmptyValues(data) : undefined,
        undefined,
        nameChanged ? newName : undefined,
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
    setErrorMessage('')
    setOriginalSplitSchema(cloneDeep(splitSchema))
  }

  function handleCancel() {
    onIsEditChange(false)
    setNewName(deploymentAssessment.name)
    setErrorMessage('')
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
          <Stack sx={{ overflow: 'hidden' }} spacing={1}>
            <LabelledInput label='Name' fullWidth required={isEdit}>
              <Stack
                direction='row'
                sx={{
                  alignItems: 'left',
                }}
              >
                {isEdit ? (
                  <TextField
                    value={newName}
                    fullWidth
                    onChange={(event) => setNewName(event.target.value)}
                    size='small'
                  />
                ) : (
                  <>
                    <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }} variant='h6'>
                      {deploymentAssessment ? deploymentAssessment.name : 'Loading...'}
                    </Typography>
                  </>
                )}
              </Stack>
            </LabelledInput>
            <LabelledValue label='Created by'>
              <UserDisplay dn={deploymentAssessment.createdBy} />
            </LabelledValue>
          </Stack>
        )}
      </>
    ),
    [deploymentAssessment, isEdit, newName, schema],
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
          editButtonText='Edit deployment assessment'
          deleteButtonText='Delete deployment assessment'
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
        <DeletionConfirmationDialogue
          open={open}
          title='Delete Deployment Assessment'
          onClose={() => setOpen(false)}
          onDelete={() => deleteDeploymentAssessment(deploymentAssessment.id)}
          confirmationText={deploymentAssessment.name}
          successMessage='Deployment assessment deleted'
          redirectTo='/deployment-assessments'
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
