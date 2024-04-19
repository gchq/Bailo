import { ArrowBack, DesignServices } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Button, Card, Container, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { CreateReleaseParams, postRelease } from 'actions/release'
import axios from 'axios'
import { useRouter } from 'next/router'
import qs from 'querystring'
import { FormEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/releases/ReleaseForm'
import { FileInterface, FileUploadProgress, FileWithMetadata, FlattenedModelImage, isFileInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidSemver } from 'utils/stringUtils'

export default function NewRelease() {
  const [semver, setSemver] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [files, setFiles] = useState<(File | FileInterface)[]>([])
  const [filesMetadata, setFilesMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const router = useRouter()
  const sendNotification = useNotification()

  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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
            ? `/api/v2/model/${model.id}/files/upload/simple?name=${file.name}&mime=${file.type}?${qs.stringify({
                metadata,
              })}`
            : `/api/v2/model/${model.id}/files/upload/simple?name=${file.name}&mime=${file.type}`,
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
              msg: `Error code ${error.response.status} received from server whilst attempting to upload file ${file.name}`,
            })
          } else if (error.request) {
            sendNotification({
              variant: 'error',
              msg: `There was a problem with the request whilst attempting to upload file ${file.name}`,
            })
          } else {
            sendNotification({ variant: 'error', msg: `Unknown error whilst attempting to upload file ${file.name}` })
          }
        })

      setCurrentFileUploadProgress(undefined)
      if (fileResponse) {
        setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name])
        fileIds.push(fileResponse.data.file._id)
      } else {
        return setLoading(false)
      }
    }

    const release: CreateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: model.card.version,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds,
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
                  onFilesChange={(value) => setFiles(value)}
                  filesMetadata={filesMetadata}
                  onFilesMetadataChange={(value) => setFilesMetadata(value)}
                  onImageListChange={(value) => setImageList(value)}
                  currentFileUploadProgress={currentFileUploadProgress}
                  uploadedFiles={uploadedFiles}
                  filesToUploadCount={files.length}
                />
                <Stack alignItems='flex-end'>
                  <LoadingButton
                    variant='contained'
                    loading={loading}
                    type='submit'
                    disabled={!semver || !releaseNotes || !isValidSemver(semver)}
                    sx={{ width: 'fit-content' }}
                    data-test='createReleaseButton'
                  >
                    Create Release
                  </LoadingButton>
                  <MessageAlert message={errorMessage} severity='error' />
                </Stack>
              </Stack>
            </Box>
          </Card>
        </Container>
      )}
    </>
  )
}
