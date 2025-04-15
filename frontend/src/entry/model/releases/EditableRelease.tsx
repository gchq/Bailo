import { Alert, Box, Divider, Stack, Typography } from '@mui/material'
import { postFileForModelId } from 'actions/file'
import { useGetModel } from 'actions/model'
import {
  deleteRelease,
  putRelease,
  UpdateReleaseParams,
  useGetRelease,
  useGetReleasesForModelId,
} from 'actions/release'
import { AxiosProgressEvent } from 'axios'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import {
  EntryKind,
  FileInterface,
  FileWithMetadata,
  FlattenedModelImage,
  isFileInterface,
  ReleaseInterface,
  SuccessfulFileUpload,
} from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

type EditableReleaseProps = {
  release: ReleaseInterface
  isEdit: boolean
  onIsEditChange: (value: boolean) => void
  readOnly?: boolean
}

export default function EditableRelease({ release, isEdit, onIsEditChange, readOnly = false }: EditableReleaseProps) {
  const [semver, setSemver] = useState(release.semver)
  const [releaseNotes, setReleaseNotes] = useState(release.notes)
  const [isMinorRelease, setIsMinorRelease] = useState(!!release.minor)
  const [files, setFiles] = useState<(File | FileInterface)[]>(release.files)
  const [filesMetadata, setFilesMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>(release.images)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistryError, setIsRegistryError] = useState(false)
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [filesToUploadCount, setFilesToUploadCount] = useState(0)
  const [successfulFileUploads, setSuccessfulFileUploads] = useState<SuccessfulFileUpload[]>([])
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])

  const { model, isModelLoading, isModelError } = useGetModel(release.modelId, EntryKind.MODEL)
  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateRelease } = useGetRelease(release.modelId, release.semver)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const router = useRouter()

  const handleRegistryError = useCallback((value: boolean) => setIsRegistryError(value), [])

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

  const failedFileList = useMemo(
    () =>
      failedFileUploads.map((file) => (
        <div key={file.fileName}>
          <Box component='span' fontWeight='bold'>
            {file.fileName}
          </Box>
          {` - ${file.error}`}
        </div>
      )),
    [failedFileUploads],
  )

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

  const handleFileOnChange = (newFiles: (File | FileInterface)[]) => {
    // Filter out any deleted files from success list
    const filteredUploads = successfulFileUploads.filter((file) =>
      newFiles.some((newFile) => file.fileName !== newFile.name),
    )
    setSuccessfulFileUploads(filteredUploads)
    setFiles(newFiles)
  }

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
    setErrorMessage('')
    resetForm()
    onIsEditChange(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setFailedFileUploads([])
    const failedFiles: FailedFileUpload[] = []
    const successfulFiles: SuccessfulFileUpload[] = []
    const newFilesToUpload: File[] = []
    for (const file of files) {
      if (isFileInterface(file)) {
        successfulFiles.push({ fileName: file.name, fileId: file._id })
      } else {
        newFilesToUpload.push(file)
      }
    }

    setFilesToUploadCount(newFilesToUpload.length)
    for (const file of newFilesToUpload) {
      if (isFileInterface(file)) {
        successfulFiles.push({ fileName: file.name, fileId: file._id })
        continue
      }

      if (!successfulFileUploads.find((successfulFile) => successfulFile.fileName === file.name)) {
        const metadata = filesMetadata.find((fileWithMetadata) => fileWithMetadata.fileName === file.name)?.metadata

        const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setCurrentFileUploadProgress({ fileName: file.name, uploadProgress: percentCompleted })
          }
        }

        try {
          const fileUploadResponse = await postFileForModelId(model.id, file, handleUploadProgress, metadata)
          setCurrentFileUploadProgress(undefined)
          if (fileUploadResponse) {
            setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name])
            successfulFiles.push({ fileName: file.name, fileId: fileUploadResponse.data.file._id })
          } else {
            setCurrentFileUploadProgress(undefined)
            return setIsLoading(false)
          }
        } catch (e) {
          if (e instanceof Error) {
            failedFiles.push({ fileName: file.name, error: e.message })
            setIsLoading(false)
            setCurrentFileUploadProgress(undefined)
          }
        }
      }
    }
    successfulFiles.forEach((file) => {
      if (!successfulFileUploads.find((successfulFile) => successfulFile.fileName === file.fileName)) {
        setSuccessfulFileUploads([...successfulFileUploads, file])
      }
    })

    if (failedFiles.length > 0) {
      setFailedFileUploads(failedFiles)
      return
    }

    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: successfulFiles.map((file) => file.fileId),
      images: imageList,
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
    <Stack spacing={2}>
      <EditableFormHeading
        heading={
          <Stack direction={'column'} sx={{ overflow: 'hidden' }}>
            <Typography fontWeight='bold'>Release name</Typography>
            <Typography noWrap>{`${model.name} - ${release.semver}`}</Typography>
          </Stack>
        }
        editAction='editRelease'
        deleteAction='deleteRelease'
        editButtonText='Edit Release'
        deleteButtonText='Delete Release'
        isEdit={isEdit}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onDelete={() => setOpen(true)}
        errorMessage={errorMessage}
        isRegistryError={isRegistryError}
        readOnly={readOnly}
        disableSaveButton={releaseNotes === ''}
      />
      {failedFileUploads.length > 0 && (
        <Alert severity='error' sx={{ my: 2 }}>
          <Stack spacing={1}>
            <Typography>{`Unable to create release due to issues with the following ${plural(
              failedFileUploads.length,
              'file',
            )}:`}</Typography>
            {failedFileList}
          </Stack>
        </Alert>
      )}
      <Divider />
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
        onFilesChange={(value) => handleFileOnChange(value)}
        onFilesMetadataChange={(value) => setFilesMetadata(value)}
        onImageListChange={(value) => setImageList(value)}
        onRegistryError={handleRegistryError}
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
    </Stack>
  )
}
