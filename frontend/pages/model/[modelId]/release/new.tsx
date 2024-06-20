import { ArrowBack, DesignServices } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Button, Card, Container, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModel } from 'actions/model'
import { CreateReleaseParams, postRelease, postSimpleFileForRelease } from 'actions/release'
import { AxiosProgressEvent } from 'axios'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import {
  EntryKind,
  FailedFileUpload,
  FileInterface,
  FileUploadProgress,
  FileWithMetadata,
  FlattenedModelImage,
  isFileInterface,
  SuccessfulFileUpload,
} from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidSemver, plural } from 'utils/stringUtils'

export default function NewRelease() {
  const [semver, setSemver] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [files, setFiles] = useState<(File | FileInterface)[]>([])
  const [filesMetadata, setFilesMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistryError, setIsRegistryError] = useState(false)
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [successfulFileNames, setSuccessfulFileNames] = useState<SuccessfulFileUpload[]>([])
  const [failedFileNames, setFailedFileNames] = useState<FailedFileUpload[]>([])

  const router = useRouter()
  const theme = useTheme()

  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId, EntryKind.MODEL)

  const handleRegistryError = useCallback((value: boolean) => setIsRegistryError(value), [])

  const failedFileList = useMemo(() => {
    return failedFileNames.map((file) => (
      <div key={file.filename}>
        <span style={{ fontWeight: 'bold' }}>{file.filename}</span> - {file.error}
      </div>
    ))
  }, [failedFileNames])

  const handleFileOnChange = (newFiles: (File | FileInterface)[]) => {
    const removedDeletedFilesFromSuccessList = successfulFileNames.filter((file) =>
      newFiles.some((newFile) => file.filename !== newFile.name),
    )
    setSuccessfulFileNames(removedDeletedFilesFromSuccessList)
    setFiles(newFiles)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setFailedFileNames([])

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

    const failedFiles: FailedFileUpload[] = []
    const successfulFiles: SuccessfulFileUpload[] = []
    for (const file of files) {
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
            setLoading(false)
          }
        } catch (e) {
          if (e instanceof Error) {
            failedFiles.push({ filename: file.name, error: e.message })
            setCurrentFileUploadProgress(undefined)
            setLoading(false)
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

    const release: CreateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: successfulFiles.map((file) => file.fileId),
      images: imageList,
    }

    const response = await postRelease(release)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
      setLoading(false)
    } else {
      const body = await response.json()
      setUploadedFiles([])
      setCurrentFileUploadProgress(undefined)
      router.push(`/model/${modelId}/release/${body.release.semver}`)
    }
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
          <Card sx={{ my: 4, p: 4 }}>
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
                  }}
                  onSemverChange={(value) => setSemver(value)}
                  onReleaseNotesChange={(value) => setReleaseNotes(value)}
                  onMinorReleaseChange={(value) => setIsMinorRelease(value)}
                  onFilesChange={(value) => handleFileOnChange(value)}
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
              </Stack>
            </Box>
          </Card>
        </Container>
      )}
    </>
  )
}
