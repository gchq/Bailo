import { Stack, Typography } from '@mui/material'
import { putInference, UpdateInferenceParams, useGetInference } from 'actions/inferencing'
import { useGetModel } from 'actions/model'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import InferenceForm from 'src/entry/model/inferencing/InferenceForm'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, InferenceInterface } from 'types/types'
import { FlattenedModelImage } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getRequiredRolesText, hasRole } from 'utils/roles'
import { isValidPortNumber } from 'utils/stringUtils'

type EditableInferenceProps = {
  inference: InferenceInterface
  currentUserRoles: string[]
}

export default function EditableInference({ inference, currentUserRoles }: EditableInferenceProps) {
  const [image, setImage] = useState<FlattenedModelImage>({
    name: inference.image,
    tag: inference.tag,
    repository: inference.modelId,
  })
  const [description, setDescription] = useState(inference.description)
  const [port, setPort] = useState(inference.settings.port.toString())
  const [processorType, setProcessorType] = useState(inference.settings.processorType)
  const [memory, setMemory] = useState(inference.settings.memory)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRegistryError, setIsRegistryError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEdit, onIsEditChange] = useState(false)

  const { model, isModelLoading, isModelError } = useGetModel(inference.modelId, EntryKind.MODEL)
  const { mutateInference } = useGetInference(inference.modelId, inference.image, inference.tag)
  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  const [canUserEditOrDelete, actionButtonsTooltip] = useMemo(() => {
    const validRoles = ['owner', 'mtr', 'msro', 'contributor']
    return [hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

  const resetForm = useCallback(() => {
    setDescription(inference.description)
    setPort(inference.settings.port.toString())
    setProcessorType(inference.settings.processorType)
    setMemory(inference.settings.memory)
  }, [setDescription, setPort, setProcessorType, setMemory, inference])

  const handleRegistryError = useCallback((value: boolean) => setIsRegistryError(value), [])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  const handleEdit = () => {
    onIsEditChange(true)
  }

  const handleCancel = () => {
    resetForm()
    onIsEditChange(false)
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (!model || isModelLoading) {
    return <Loading />
  }

  const handleSubmit = async () => {
    if (!isValidPortNumber(port)) {
      return setErrorMessage('Port number must be in the range 1-65535.')
    }

    setErrorMessage('')
    setIsLoading(true)

    const updatedInference: UpdateInferenceParams = {
      description: description,
      settings: {
        port: Number(port),
        memory: memory,
        processorType: processorType,
      },
    }
    const res = await putInference(model.id, inference.image, inference.tag, updatedInference)

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutateInference()
      onIsEditChange(false)
    }
    setIsLoading(false)
  }

  return (
    <>
      <EditableFormHeading
        heading={
          <Stack>
            <Typography fontWeight='bold'>Deployed Image </Typography>
            <Typography>{`${model.name} - ${inference.image}:${inference.tag}`}</Typography>
          </Stack>
        }
        isEdit={isEdit}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        canUserEditOrDelete={canUserEditOrDelete}
        actionButtonsTooltip={actionButtonsTooltip}
        errorMessage={errorMessage}
        isRegistryError={isRegistryError}
        editButtonText='Edit Settings'
      />
      <InferenceForm
        editable
        isEdit={isEdit}
        model={model}
        formData={{ image, description, port, processorType, memory }}
        onImageChange={(value) => setImage(value)}
        onDescriptionChange={(value) => setDescription(value)}
        onRegistryError={handleRegistryError}
        onProcessorTypeChange={(value) => setProcessorType(value)}
        onMemoryChange={(value) => setMemory(value)}
        onPortChange={(value) => setPort(value)}
      />
    </>
  )
}
