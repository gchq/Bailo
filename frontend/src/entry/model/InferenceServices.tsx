import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { sendTokenToService, useGetInferencesForModelId } from 'actions/inferencing'
import { useGetUiConfig } from 'actions/uiConfig'
import { deleteUserToken, postUserToken, useGetUserTokens } from 'actions/user'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import InferenceDisplay from 'src/entry/model/inferencing/InferenceDisplay'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type InferenceProps = {
  model: EntryInterface
}

export default function InferenceServices({ model }: InferenceProps) {
  const router = useRouter()
  const { inferences, isInferencesLoading, isInferencesError } = useGetInferencesForModelId(model.id)
  const [errorMessage, setErrorMessage] = useState('')
  const [healthCheck, setHealthCheck] = useState(false)

  const { tokens, isTokensLoading, isTokensError, mutateTokens } = useGetUserTokens()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  useEffect(() => {
    async function checkAuthentication() {
      fetch(`${uiConfig?.inference.connection.host}/api/health`, { credentials: 'include' }).then((response) => {
        setHealthCheck(response.status === 200)
      })
    }
    checkAuthentication()
  }, [uiConfig])

  const inferenceDisplays = useMemo(
    () =>
      inferences.length ? (
        inferences.map((inference) => (
          <InferenceDisplay model={model} inference={inference} key={`${inference.image}:${inference.tag}`} />
        ))
      ) : (
        <EmptyBlob text={`No inference services found for model ${model.name}`} />
      ),
    [model, inferences],
  )

  const handleCreateToken = async () => {
    const error = MultipleErrorWrapper('Unable to create an authenication token', { isTokensError, isUiConfigError })
    if (error) return error
    const authorizationTokenName = uiConfig?.inference.authorizationTokenName
    const authorizationAccessKeys = tokens.filter((value) => value.description === authorizationTokenName)
    if (authorizationTokenName && authorizationAccessKeys) {
      for (const token of authorizationAccessKeys) {
        deleteUserToken(token.accessKey)
      }
      const response = await postUserToken(authorizationTokenName, 'all', [], ['model:read'])

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response))
      } else {
        const { token } = await response.json()
        const inferenceCheck = await sendTokenToService(`${uiConfig.inference.connection.host}/api/login`, token)
        if (!inferenceCheck.ok) {
          setErrorMessage('Login failed when when accessing the inferencing service')
        } else {
          router.reload()
        }
      }
    }
    mutateTokens()
  }

  function handleCreateNewInferenceService() {
    router.push(`/model/${model.id}/inference/new`)
  }

  if (isInferencesError) {
    return <MessageAlert message={isInferencesError.info.message} severity='error' />
  }

  if (isTokensLoading || isUiConfigLoading) {
    return <Loading />
  }

  return (
    <Container sx={{ my: 2 }}>
      {healthCheck ? (
        <Stack spacing={4}>
          <Box sx={{ textAlign: 'right' }}>
            <Button variant='outlined' onClick={handleCreateNewInferenceService}>
              Create Service
            </Button>
          </Box>
          {isInferencesLoading && <Loading />}
          {inferenceDisplays}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Typography>
            Access to inferencing services requires token a with model access. Are you sure you want to proceed?
          </Typography>
          <Stack spacing={2} direction='row'>
            <Button variant='contained' onClick={handleCreateToken}>
              Yes
            </Button>
          </Stack>
          {errorMessage && <MessageAlert message={errorMessage} severity='error' />}
        </Stack>
      )}
    </Container>
  )
}
