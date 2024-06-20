import { Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModel } from 'actions/model'
import {
  deleteRelease,
  postSimpleFileForRelease,
  putRelease,
  UpdateReleaseParams,
  useGetRelease,
  useGetReleasesForModelId,
} from 'actions/release'
import { AxiosProgressEvent } from 'axios'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import {
  EntryKind,
  FailedFileUpload,
  FileInterface,
  FileUploadProgress,
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
  const [isRegistryError, setIsRegistryError] = useState(false)
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [filesToUploadCount, setFilesToUploadCount] = useState(0)
  const [successfulFileNames, setSuccessfulFileNames] = useState<SuccessfulFileUpload[]>([])
  const [failedFileNames, setFailedFileNames] = useState<FailedFileUpload[]>([])

  const { model, isModelLoading, isModelError } = useGetModel(release.modelId, EntryKind.MODEL)
  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateRelease } = useGetRelease(release.modelId, release.semver)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const router = useRouter()
  const theme = useTheme()

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

  const failedFileList = useMemo(() => {
    return failedFileNames.map((file) => (
      <div key={file.filename}>
        <span style={{ fontWeight: 'bold' }}>{file.filename}</span> - {file.error}
      </div>
    ))
  }, [failedFileNames])

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
    const removedDeletedFilesFromSuccessList = successfulFileNames.filter((file) =>
      newFiles.some((newFile) => file.filename !== newFile.name),
    )
    setSuccessfulFileNames(removedDeletedFilesFromSuccessList)
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
    resetForm()
    onIsEditChange(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setFailedFileNames([])
    const failedFiles: FailedFileUpload[] = []
    const successfulFiles: SuccessfulFileUpload[] = []
    const newFilesToUpload: File[] = []
    for (const file of files) {
      isFileInterface(file)
        ? successfulFiles.push({ filename: file.name, fileId: file._id })
        : newFilesToUpload.push(file)
    }

    setFilesToUploadCount(newFilesToUpload.length)
    for (const file of newFilesToUpload) {
      if (isFileInterface(file)) {
        successfulFiles.push({ filename: file.name, fileId: file._id })
        continue
      }

      if (!successfulFileNames.find((successfulFile) => successfulFile.filename === file.name)) {
        const metadata = filesMetadata.find((fileWithMetadata) => fileWithMetadata.fileName === file.name)?.metadata

        const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setCurrentFileUploadProgress({ fileName: file.name, uploadProgress: percentCompleted })
          }
        }

        try {
          const fileUploadResponse = await postSimpleFileForRelease(model.id, file, handleUploadProgress, metadata)
          setCurrentFileUploadProgress(undefined)
          if (fileUploadResponse) {
            setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name])
            successfulFiles.push({ filename: file.name, fileId: fileUploadResponse.data.file._id })
          } else {
            setCurrentFileUploadProgress(undefined)
            return setIsLoading(false)
          }
        } catch (e) {
          if (e instanceof Error) {
            failedFiles.push({ filename: file.name, error: e.message })
            setIsLoading(false)
            setCurrentFileUploadProgress(undefined)
          }
        }
      }
    }
    successfulFiles.forEach((file) => {
      if (!successfulFileNames.find((successfulFile) => successfulFile.filename === file.filename)) {
        setSuccessfulFileNames([...successfulFileNames, file])
      }
    })

    if (failedFiles.length > 0) {
      setFailedFileNames(failedFiles)
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
    <Stack spacing={2}>
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
        isRegistryError={isRegistryError}
      />
      {failedFileNames.length > 0 && (
        <Stack spacing={2}>
          <Typography
            color={theme.palette.error.main}
          >{`Unable to create release due to issues with the following ${plural(
            failedFileNames.length,
            'file',
          )}:`}</Typography>
          {failedFileList}
        </Stack>
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
