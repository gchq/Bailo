import { Box, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import {
  deleteRelease,
  postFile,
  putRelease,
  UpdateReleaseParams,
  useGetRelease,
  useGetReleasesForModelId,
} from 'actions/release'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/releases/ReleaseForm'
import { FileInterface, FileWithMetadata, FlattenedModelImage, isFileInterface, ReleaseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type EditableReleaseProps = {
  release: ReleaseInterface
  isEdit: boolean
  onIsEditChange: (value: boolean) => void
}

export default function EditableRelease({ release, isEdit, onIsEditChange }: EditableReleaseProps) {
  const [semver, setSemver] = useState(release.semver)
  const [releaseNotes, setReleaseNotes] = useState(release.notes)
  const [isMinorRelease, setIsMinorRelease] = useState(!!release.minor)
  const [files, setFiles] = useState<(File | FileInterface)[]>(release.files)
  const [filesMetadata, setFilesMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>(release.images)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  const { model, isModelLoading, isModelError } = useGetModel(release.modelId)
  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateRelease } = useGetRelease(release.modelId, release.semver)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const router = useRouter()

  const handleDeleteConfirm = useCallback(async () => {
    setErrorMessage('')
    if (model) {
      const res = await deleteRelease(model.id, semver)
      if (!res.ok) {
        setDeleteErrorMessage(await getErrorMessage(res))
      } else {
        mutateReleases()
        setOpen(false)
        router.push(`/model/${model.id}?tab=releases`)
      }
    }
  }, [model, mutateReleases, semver, router])

  const resetForm = useCallback(() => {
    setSemver(release.semver)
    setReleaseNotes(release.notes)
    setIsMinorRelease(!!release.minor)
    setFiles(release.files)
    setFilesMetadata(release.files.map((file) => ({ fileName: file.name, metadata: '' })))
    setImageList(release.images)
  }, [release.semver, release.notes, release.minor, release.files, release.images])

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
    onIsEditChange(true)
  }

  const handleCancel = () => {
    resetForm()
    onIsEditChange(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    const fileIds: string[] = []
    for (const file of files) {
      if (isFileInterface(file)) {
        fileIds.push(file._id)
        continue
      }

      const metadata = filesMetadata.find((fileWithMetadata) => fileWithMetadata.fileName === file.name)?.metadata
      const postFileResponse = await postFile(file, model.id, file.name, file.type, metadata)

      if (!postFileResponse.ok) {
        setErrorMessage(await getErrorMessage(postFileResponse))
        return setIsLoading(false)
      }

      const res = await postFileResponse.json()
      fileIds.push(res.file._id)
    }

    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds,
      images: imageList,
      // Comments are ignored when editing a release
      comments: [],
    }

    const response = await putRelease(updatedRelease)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      mutateReleases()
      mutateRelease()
      onIsEditChange(false)
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
        deleteButtonText='Delete Release'
        showDeleteButton
        isEdit={isEdit}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onDelete={() => setOpen(true)}
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
      <ConfirmationDialogue
        open={open}
        title='Delete Release'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOpen(false)}
        errorMessage={deleteErrorMessage}
        dialogMessage={'Are you sure you want to delete this release?'}
      />
    </Box>
  )
}
