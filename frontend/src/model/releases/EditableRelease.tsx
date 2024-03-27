import { Box, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { putRelease, UpdateReleaseParams, useGetRelease, useGetReleasesForModelId } from 'actions/release'
import axios from 'axios'
import qs from 'querystring'
import { useCallback, useContext, useEffect, useState } from 'react'
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

  const { model, isModelLoading, isModelError } = useGetModel(release.modelId)
  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateRelease } = useGetRelease(release.modelId, release.semver)
  const sendNotification = useNotification()

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

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
        currentFileUploadProgress={currentFileUploadProgress}
        uploadedFiles={uploadedFiles}
      />
    </Box>
  )
}
