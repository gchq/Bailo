import { Box, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import {
  deleteRelease,
  putRelease,
  UpdateReleaseParams,
  useGetRelease,
  useGetReleasesForModelId,
} from 'actions/release'
import axios from 'axios'
import { useRouter } from 'next/router'
import qs from 'querystring'
import { useCallback, useContext, useEffect, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/releases/ReleaseForm'
import {
  FileInterface,
  FileUploadProgress,
  FileWithMetadata,
  FlattenedModelImage,
  isFileInterface,
  ReleaseInterface,
} from 'types/types'
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
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [filesToUploadCount, setFilesToUploadCount] = useState(0)

  const { model, isModelLoading, isModelError } = useGetModel(release.modelId)
  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateRelease } = useGetRelease(release.modelId, release.semver)
  const sendNotification = useNotification()

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
    const newFilesToUpload: File[] = []
    for (const file of files) {
      isFileInterface(file) ? fileIds.push(file._id) : newFilesToUpload.push(file)
    }

    setFilesToUploadCount(newFilesToUpload.length)

    for (const file of newFilesToUpload) {
      if (isFileInterface(file)) {
        fileIds.push(file._id)
        continue
      }

      const metadata = filesMetadata.find((fileWithMetadata) => fileWithMetadata.fileName === file.name)?.metadata

      const fileResponse = await axios
        .post(
          metadata
            ? `/api/v2/model/${release.modelId}/files/upload/simple?name=${file.name}&mime=${file.type}?${qs.stringify({
                metadata,
              })}`
            : `/api/v2/model/${release.modelId}/files/upload/simple?name=${file.name}&mime=${file.type}`,
          file,
          {
            onUploadProgress: function (progressEvent) {
              if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                setCurrentFileUploadProgress({ fileName: file.name, uploadProgress: percentCompleted })
              }
            },
          },
        )
        .catch(function (error) {
          if (error.response) {
            sendNotification({
              variant: 'error',
              msg: `Error code ${error.response.status} recieved from server whilst attemping to upload file ${file.name}`,
            })
          } else if (error.request) {
            sendNotification({
              variant: 'error',
              msg: `There was a problem with the request whilst attemping to upload file ${file.name}`,
            })
          } else {
            sendNotification({ variant: 'error', msg: `Unknown error whilst attemping to upload file ${file.name}` })
          }
        })

      setCurrentFileUploadProgress(undefined)
      if (fileResponse) {
        setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name])
        fileIds.push(fileResponse.data.file._id)
      } else {
        setCurrentFileUploadProgress(undefined)
        return setIsLoading(false)
      }
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
      setUploadedFiles([])
      setCurrentFileUploadProgress(undefined)
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
        currentFileUploadProgress={currentFileUploadProgress}
        uploadedFiles={uploadedFiles}
        filesToUploadCount={filesToUploadCount}
      />
      <ConfirmationDialogue
        open={open}
        title='Delete Release'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOpen(false)}
        errorMessage={deleteErrorMessage}
        dialogMessage={
          'Are you sure you want to delete this release? You will be unable to create a new release using this semver unless an admin restores it for you.'
        }
      />
    </Box>
  )
}
