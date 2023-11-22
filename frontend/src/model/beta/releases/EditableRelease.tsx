import { Box, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { postFile, putRelease, UpdateReleaseParams, useGetReleasesForModelId } from 'actions/release'
import { useCallback, useContext, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/beta/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/beta/releases/ReleaseForm'
import { FileWithMetadata, FlattenedModelImage } from 'types/interfaces'
import { ReleaseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type EditableReleaseProps = {
  release: ReleaseInterface
}

export default function EditableRelease({ release }: EditableReleaseProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [semver, setSemver] = useState(release.semver)
  const [releaseNotes, setReleaseNotes] = useState(release.notes)
  const [isMinorRelease, setIsMinorRelease] = useState(!!release.minor)
  const [artefacts, setArtefacts] = useState<File[]>([]) // TODO - Default to using the release artefact files (BAI-1026)
  const [artefactsMetadata, setArtefactsMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>(release.images)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { model, isModelLoading, isModelError } = useGetModel(release.modelId)
  const { mutateReleases } = useGetReleasesForModelId(model?.id)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  const resetForm = useCallback(() => {
    setSemver(release.semver)
    setReleaseNotes(release.notes)
    setIsMinorRelease(!!release.minor)
    setArtefacts([]) // TODO - Reset the release artefact files (BAI-1026)
    setArtefactsMetadata([])
    setImageList(release.images)
  }, [release.images, release.minor, release.notes, release.semver])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (!model || isModelLoading) {
    return <Loading />
  }

  const handleEdit = () => {
    setIsEdit(true)
  }

  const handleCancel = () => {
    resetForm()
    setIsEdit(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    const fileIds: string[] = []
    for (const artefact of artefacts) {
      const postArtefactResponse = await postFile(artefact, model.id, artefact.name, artefact.type)
      if (postArtefactResponse.ok) {
        const res = await postArtefactResponse.json()
        fileIds.push(res.file._id)
      } else {
        return setErrorMessage(await getErrorMessage(postArtefactResponse))
      }
    }

    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: fileIds,
      images: imageList,
    }

    const response = await putRelease(updatedRelease)

    if (!response.ok) {
      const error = await getErrorMessage(response)
      setIsLoading(false)
      return setErrorMessage(error)
    }

    setIsLoading(false)
    setIsEdit(false)
    mutateReleases()
  }

  return (
    <Box py={1}>
      <EditableFormHeading
        heading={
          <div>
            <Typography fontWeight='bold'>Release name</Typography>
            <Typography>{`${model.name} - ${release.semver}`}</Typography>
          </div>
        }
        editButtonText='Edit Release'
        isEdit={isEdit}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
      />
      <ReleaseForm
        editable
        isEdit={isEdit}
        model={model}
        formData={{
          semver,
          releaseNotes,
          isMinorRelease,
          artefacts,
          imageList,
        }}
        artefactsMetadata={artefactsMetadata}
        onSemverChange={(value) => setSemver(value)}
        onReleaseNotesChange={(value) => setReleaseNotes(value)}
        onMinorReleaseChange={(value) => setIsMinorRelease(value)}
        onArtefactsChange={(value) => setArtefacts(value)}
        onArtefactsMetadataChange={(value) => setArtefactsMetadata(value)}
        onImageListChange={(value) => setImageList(value)}
      />
    </Box>
  )
}
