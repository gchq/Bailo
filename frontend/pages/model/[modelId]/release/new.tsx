import ArrowBack from '@mui/icons-material/ArrowBack'
import DesignServices from '@mui/icons-material/DesignServices'
import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { postFileForModelId } from 'actions/file'
import { CreateReleaseParams, postRelease } from 'actions/release'
import { AxiosProgressEvent } from 'axios'
import { useRouter } from 'next/router'
import { SyntheticEvent, useCallback, useContext, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import MessageAlert from 'src/MessageAlert'
import {
  FileInterface,
  FileWithMetadataAndTags,
  FlattenedModelImage,
  isFileInterface,
  SuccessfulFileUpload,
} from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidSemver, plural } from 'utils/stringUtils'

export default function NewRelease() {
  const [semver, setSemver] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [modelCardVersion, setModelCardVersion] = useState(0)
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const draft = useRef(false)
  const [files, setFiles] = useState<(File | FileInterface)[]>([])
  const [filesMetadata, setFilesMetadata] = useState<FileWithMetadataAndTags[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistryError, setIsRegistryError] = useState(false)
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [successfulFileUploads, setSuccessfulFileUploads] = useState<SuccessfulFileUpload[]>([])
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])
  const [formTouched, setFormTouched] = useState(false)

  const router = useRouter()
  const { unsavedChanges, setUnsavedChanges, sendWarning } = useContext(UnsavedChangesContext)

  useEffect(() => {
    setUnsavedChanges(formTouched)
  }, [formTouched, setUnsavedChanges])

  useEffect(() => {
    return () => setUnsavedChanges(false)
  }, [setUnsavedChanges])

  const { modelId }: { modelId?: string } = router.query
  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)

  const updateModelCardVersionEffectEvent = useEffectEvent((cardVersion: number) => {
    setModelCardVersion(cardVersion)
  })

  useEffect(() => {
    if (model && !modelCardVersion) {
      updateModelCardVersionEffectEvent(model.card.version)
    }
  }, [model, setModelCardVersion, modelCardVersion])

  const handleRegistryError = useCallback((value: boolean) => setIsRegistryError(value), [])

  const failedFileList = useMemo(
    () =>
      failedFileUploads.map((file) => (
        <div key={file.fileName}>
          <Box
            component='span'
            sx={{
              fontWeight: 'bold',
            }}
          >
            {file.fileName}
          </Box>
          {` - ${file.error}`}
        </div>
      )),
    [failedFileUploads],
  )

  const handleFileOnChange = (newFiles: (File | FileInterface)[]) => {
    // Filter out any deleted files from success list
    const filteredUploads = successfulFileUploads.filter((file) =>
      newFiles.some((newFile) => file.fileName !== newFile.name),
    )
    setSuccessfulFileUploads(filteredUploads)
    setFiles(newFiles)
  }

  const navigateBackToModel = useCallback(() => {
    setUnsavedChanges(false)
    router.push(`/model/${modelId}?tab=releases`)
  }, [modelId, router, setUnsavedChanges])

  const handleBackToModel = useCallback(() => {
    if (unsavedChanges) {
      sendWarning(navigateBackToModel)
    } else {
      navigateBackToModel()
    }
  }, [unsavedChanges, sendWarning, navigateBackToModel])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    setFailedFileUploads([])
    const failedFiles: FailedFileUpload[] = []

    if (!model) {
      return setErrorMessage('Please wait for the model to finish loading before trying to make a release.')
    }

    if (!model.card.version) {
      return setErrorMessage('Please make sure your model has a schema set before drafting a release.')
    }

    if (!isValidSemver(semver)) {
      return setErrorMessage('Please set a valid semver value before drafting a release.')
    }

    setErrorMessage('')
    setLoading(true)

    const successfulFiles: SuccessfulFileUpload[] = []
    for (const file of files) {
      if (isFileInterface(file)) {
        successfulFiles.push({ fileName: file.name, fileId: file._id })
        continue
      }

      if (!successfulFileUploads.find((successfulFile) => successfulFile.fileName === file.name)) {
        const metadataText = filesMetadata.find((fileWithMetadata) => fileWithMetadata.fileName === file.name)?.metadata
          .text
        const tags = filesMetadata.find((fileWithMetadata) => fileWithMetadata.fileName === file.name)?.metadata.tags

        const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setCurrentFileUploadProgress({ fileName: file.name, uploadProgress: percentCompleted })
          }
        }

        const metadata = {
          text: metadataText ? metadataText : '',
          tags: tags ? tags : [],
        }

        try {
          const fileUploadResponse = await postFileForModelId(model.id, file, handleUploadProgress, metadata)
          setCurrentFileUploadProgress(undefined)
          if (fileUploadResponse) {
            setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name])
            successfulFiles.push({ fileName: file.name, fileId: fileUploadResponse.data.file._id })
          } else {
            setCurrentFileUploadProgress(undefined)
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown upload error'
          const failed = { fileName: file.name, error: message }
          failedFiles.push(failed)

          setFailedFileUploads((prev) => [...prev, failed])
          setCurrentFileUploadProgress(undefined)
        }
      }
    }

    if (failedFiles.length > 0) {
      setCurrentFileUploadProgress(undefined)
      setLoading(false)
      return
    }

    const updatedSuccessfulFiles = successfulFiles.reduce(
      (updatedFiles, file) => {
        if (!successfulFileUploads.find((successfulFile) => successfulFile.fileName === file.fileName)) {
          updatedFiles.push(file)
        }
        return updatedFiles
      },
      [...successfulFileUploads],
    )
    setSuccessfulFileUploads(updatedSuccessfulFiles)

    const release: CreateReleaseParams = {
      modelId: model.id,
      semver,
      draft: draft.current as boolean,
      notes: releaseNotes,
      fileIds: successfulFiles.map((file) => file.fileId),
      minor: isMinorRelease,
      images: imageList,
      modelCardVersion: modelCardVersion,
    }

    const response = await postRelease(release)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      const body = await response.json()
      setUploadedFiles([])
      setCurrentFileUploadProgress(undefined)
      setUnsavedChanges(false)
      router.push(`/model/${modelId}/release/${body.release.semver}`)
    }
    setLoading(false)
  }

  function handleDraftRelease() {
    draft.current = true
  }

  const error = MultipleErrorWrapper(`Unable to load release page`, {
    isModelError,
  })
  if (error) {
    return error
  }

  return (
    <>
      <Title text='Draft New Release' />
      {isModelLoading && <Loading />}
      {model && !isModelLoading && (
        <Container maxWidth='md'>
          <Paper sx={{ my: 4, p: 4 }}>
            <Box component='form' onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />} onClick={handleBackToModel}>
                  Back to model
                </Button>
                <Stack
                  spacing={2}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant='h6' component='h1' color='primary'>
                    Create new release
                  </Typography>
                  <DesignServices color='primary' fontSize='large' />
                  <Typography>
                    A release takes a snapshot of the current state of the model code, files and model card. Access
                    requests will be able to select for any release of a model for deployment.
                  </Typography>
                </Stack>
                <ReleaseForm
                  model={model}
                  formData={{
                    isMinorRelease,
                    semver,
                    releaseNotes,
                    files,
                    imageList,
                    modelCardVersion,
                  }}
                  onSemverChange={(value) => {
                    setSemver(value)
                    setFormTouched(true)
                  }}
                  onReleaseNotesChange={(value) => {
                    setReleaseNotes(value)
                    setFormTouched(true)
                  }}
                  onMinorReleaseChange={(value) => {
                    setIsMinorRelease(value)
                    setFormTouched(true)
                  }}
                  onFilesChange={(value) => {
                    handleFileOnChange(value)
                    setFormTouched(true)
                  }}
                  onModelCardVersionChange={(value) => {
                    setModelCardVersion(value)
                    setFormTouched(true)
                  }}
                  filesMetadata={filesMetadata}
                  onFilesMetadataChange={(value) => {
                    setFilesMetadata(value)
                    setFormTouched(true)
                  }}
                  onImageListChange={(value) => {
                    setImageList(value)
                    setFormTouched(true)
                  }}
                  onRegistryError={handleRegistryError}
                  currentFileUploadProgress={currentFileUploadProgress}
                  uploadedFiles={uploadedFiles}
                  filesToUploadCount={files.length}
                />
                <Stack
                  sx={{
                    alignItems: 'flex-end',
                  }}
                >
                  <Stack spacing={1} direction='row'>
                    <Button
                      variant='outlined'
                      loading={loading}
                      onClick={handleDraftRelease}
                      type='submit'
                      disabled={!(semver && releaseNotes && isValidSemver(semver) && !isRegistryError)}
                      sx={{ width: 'fit-content' }}
                    >
                      Draft release
                    </Button>
                    <Button
                      variant='contained'
                      loading={loading}
                      type='submit'
                      disabled={!(semver && releaseNotes && isValidSemver(semver) && !isRegistryError)}
                      sx={{ width: 'fit-content' }}
                      data-test='createReleaseButton'
                    >
                      Publish release
                    </Button>
                  </Stack>
                  <MessageAlert message={errorMessage} severity='error' />
                </Stack>
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
              </Stack>
            </Box>
          </Paper>
        </Container>
      )}
    </>
  )
}
