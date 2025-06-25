import { ArrowBack, DesignServices } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { postFileForModelId } from 'actions/file'
import { useGetModel } from 'actions/model'
import { CreateReleaseParams, postRelease } from 'actions/release'
import { AxiosProgressEvent } from 'axios'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import {
  EntryKind,
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

  const router = useRouter()

  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId, EntryKind.MODEL)

  useEffect(() => {
    if (model && modelCardVersion === 0) {
      setModelCardVersion(model.card.version)
    }
  }, [model, setModelCardVersion, modelCardVersion])

  const handleRegistryError = useCallback((value: boolean) => setIsRegistryError(value), [])

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

  const handleFileOnChange = (newFiles: (File | FileInterface)[]) => {
    // Filter out any deleted files from success list
    const filteredUploads = successfulFileUploads.filter((file) =>
      newFiles.some((newFile) => file.fileName !== newFile.name),
    )
    setSuccessfulFileUploads(filteredUploads)
    setFiles(newFiles)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          if (e instanceof Error) {
            failedFiles.push({ fileName: file.name, error: e.message })
            setCurrentFileUploadProgress(undefined)
          }
        }
      }
    }
    setFailedFileUploads(failedFiles)

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
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: successfulFiles.map((file) => file.fileId),
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
      router.push(`/model/${modelId}/release/${body.release.semver}`)
    }
    setLoading(false)
  }

  const error = MultipleErrorWrapper(`Unable to load release page`, {
    isModelError,
  })
  if (error) return error

  return (
    <>
      <Title text='Draft New Release' />
      {isModelLoading && <Loading />}
      {model && !isModelLoading && (
        <Container maxWidth='md'>
          <Paper sx={{ my: 4, p: 4 }}>
            <Box component='form' onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Link href={`/model/${modelId}?tab=releases`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Stack spacing={2} alignItems='center' justifyContent='center'>
                  <Typography variant='h6' component='h1' color='primary'>
                    Draft New Release
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
                    semver,
                    releaseNotes,
                    isMinorRelease,
                    files,
                    imageList,
                    modelCardVersion,
                  }}
                  onSemverChange={(value) => setSemver(value)}
                  onReleaseNotesChange={(value) => setReleaseNotes(value)}
                  onMinorReleaseChange={(value) => setIsMinorRelease(value)}
                  onFilesChange={(value) => handleFileOnChange(value)}
                  onModelCardVersionChange={(value) => setModelCardVersion(value)}
                  filesMetadata={filesMetadata}
                  onFilesMetadataChange={(value) => setFilesMetadata(value)}
                  onImageListChange={(value) => setImageList(value)}
                  onRegistryError={handleRegistryError}
                  currentFileUploadProgress={currentFileUploadProgress}
                  uploadedFiles={uploadedFiles}
                  filesToUploadCount={files.length}
                />
                <Stack alignItems='flex-end'>
                  <LoadingButton
                    variant='contained'
                    loading={loading}
                    type='submit'
                    disabled={!(semver && releaseNotes && isValidSemver(semver) && !isRegistryError)}
                    sx={{ width: 'fit-content' }}
                    data-test='createReleaseButton'
                  >
                    Create Release
                  </LoadingButton>
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
