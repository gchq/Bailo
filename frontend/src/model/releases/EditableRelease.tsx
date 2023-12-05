import { Box, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { putRelease, UpdateReleaseParams, useGetReleasesForModelId } from 'actions/release'
import { useCallback, useContext, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/releases/ReleaseForm'
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
  const [files, setFiles] = useState<File[]>([]) // TODO - Default to using the release files (BAI-1026)
  const [filesMetadata, setFilesMetadata] = useState<FileWithMetadata[]>([])
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
    setFiles([]) // TODO - Reset the release files (BAI-1026)
    setFilesMetadata([])
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

    // TODO: Uncomment below and use fileIds instead of release.fileIds when creating updatedRelease (BAI-1026)
    /* const fileIds: string[] = []
    for (const file of files) {
      const postFileResponse = await postFile(file, model.id, file.name, file.type)
      if (postFileResponse.ok) {
        const res = await postFileResponse.json()
        fileIds.push(res.file._id)
      } else {
        return setErrorMessage(await getErrorMessage(postFileResponse))
      }
    } */

    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: release.fileIds, // TODO: Use fileIds from above (BAI-1026)
      images: imageList,
    }

    const response = await putRelease(updatedRelease)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      setIsEdit(false)
      mutateReleases()
    }
    setIsLoading(false)
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
          files,
          imageList,
        }}
        filesMetadata={filesMetadata}
        onSemverChange={(value) => setSemver(value)}
        onReleaseNotesChange={(value) => setReleaseNotes(value)}
        onMinorReleaseChange={(value) => setIsMinorRelease(value)}
        onFilesChange={(value) => setFiles(value)}
        onFilesMetadataChange={(value) => setFilesMetadata(value)}
        onImageListChange={(value) => setImageList(value)}
      />
    </Box>
  )
}
