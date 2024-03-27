import { Typography } from '@mui/material'
import { putInference, UpdateInferenceParams, useGetInference } from 'actions/inferencing'
import { useGetModel } from 'actions/model'
import { useCallback, useContext, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import InferenceForm from 'src/model/inferencing/InferenceForm'
import { InferenceInterface } from 'types/types'
import { FlattenedModelImage } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidPortNumber } from 'utils/stringUtils'
type EditableInferenceProps = {
  inference: InferenceInterface
}

export default function EditableInference({ inference }: EditableInferenceProps) {
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
  const [isLoading, setIsLoading] = useState(false)
  const [isEdit, onIsEditChange] = useState(false)

  const { model, isModelLoading, isModelError } = useGetModel(inference.modelId)
  const { mutateInference } = useGetInference(inference.modelId, inference.image, inference.tag)
  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  const resetForm = useCallback(() => {
    setDescription(inference.description)
    setPort(inference.settings.port.toString())
    setProcessorType(inference.settings.processorType)
    setMemory(inference.settings.memory)
  }, [setDescription, setPort, setProcessorType, setMemory, inference])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  if (!model || isModelLoading) {
    return <Loading />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  const handleEdit = () => {
    onIsEditChange(true)
  }

  const handleCancel = () => {
    resetForm()
    onIsEditChange(false)
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
          <div>
            <Typography fontWeight='bold'>Deployed Image </Typography>
            <Typography>{`${model.name} - ${inference.image}:${inference.tag}`}</Typography>
          </div>
        }
        isEdit={isEdit}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        editButtonText='Edit Settings'
      />
      <InferenceForm
        editable
        isEdit={isEdit}
        model={model}
        formData={{ image, description, port, processorType, memory }}
        onImageChange={(value) => setImage(value)}
        onDescriptionChange={(value) => setDescription(value)}
        onProcessorTypeChange={(value) => setProcessorType(value)}
        onMemoryChange={(value) => setMemory(value)}
        onPortChange={(value) => setPort(value)}
      />
    </>
  )
}
