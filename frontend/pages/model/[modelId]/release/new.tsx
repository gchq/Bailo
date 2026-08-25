import ArrowBack from '@mui/icons-material/ArrowBack'
import DesignServices from '@mui/icons-material/DesignServices'
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { CreateReleaseParams, postRelease } from 'actions/release'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useEffect, useEffectEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, FlattenedModelImage } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidSemver } from 'utils/stringUtils'

export default function NewRelease() {
  const [semver, setSemver] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [modelCardVersion, setModelCardVersion] = useState(0)
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [files, setFiles] = useState<FileInterface[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistryError, setIsRegistryError] = useState(false)

  const router = useRouter()

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

    const release: CreateReleaseParams = {
      modelId: model.id,
      semver,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: files.map((file) => file._id),
      images: imageList,
      modelCardVersion: modelCardVersion,
    }

    const response = await postRelease(release)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      const body = await response.json()
      router.push(`/model/${modelId}/release/${body.release.semver}`)
    }
    setLoading(false)
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
                <Link href={`/model/${modelId}?tab=releases`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Stack
                  spacing={2}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
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
                  onFilesChange={(value) => setFiles(value)}
                  onModelCardVersionChange={(value) => setModelCardVersion(value)}
                  onImageListChange={(value) => setImageList(value)}
                  onRegistryError={handleRegistryError}
                />
                <Stack
                  sx={{
                    alignItems: 'flex-end',
                  }}
                >
                  <Button
                    variant='contained'
                    loading={loading}
                    type='submit'
                    disabled={!(semver && releaseNotes && isValidSemver(semver) && !isRegistryError)}
                    sx={{ width: 'fit-content' }}
                    data-test='createReleaseButton'
                  >
                    Create Release
                  </Button>
                  <MessageAlert message={errorMessage} severity='error' />
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Container>
      )}
    </>
  )
}
