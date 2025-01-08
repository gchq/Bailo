import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { sendTokenToService, useGetInferencesForModelId } from 'actions/inferencing'
import { useGetUiConfig } from 'actions/uiConfig'
import { deleteUserToken, postUserToken, useGetUserTokens } from 'actions/user'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import InferenceDisplay from 'src/entry/model/inferencing/InferenceDisplay'
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
      try {
        setErrorMessage('')
        const response = await fetch(`${uiConfig?.inference.connection.host}/api/health`, { credentials: 'include' })
        setHealthCheck(response.ok)
        if (!response.ok) {
          return setErrorMessage(await getErrorMessage(response))
        }
      } catch (err) {
        setHealthCheck(false)
        return setErrorMessage(`Something went wrong requesting the inferencing service: ${err}`)
      }
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
    setErrorMessage('')

    const authorizationTokenName = uiConfig?.inference.authorizationTokenName
    const authorizationAccessKeys = tokens.filter((value) => value.description === authorizationTokenName)
    if (authorizationTokenName) {
      for (const token of authorizationAccessKeys) {
        const response = await deleteUserToken(token.accessKey)

        if (!response.ok) {
          setErrorMessage(await getErrorMessage(response))
          mutateTokens()
          return
        }
      }
      const response = await postUserToken(authorizationTokenName, 'all', [], ['model:read'])

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response))
      } else {
        const { token } = await response.json()
        try {
          const inferenceCheck = await sendTokenToService(`${uiConfig.inference.connection.host}/api/login`, token)
          if (!inferenceCheck.ok) {
            setErrorMessage('Login failed when when accessing the inferencing service')
          } else {
            router.reload()
          }
        } catch (err) {
          return setErrorMessage(`Something went wrong requesting the inferencing service: ${err}`)
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

  if (isTokensError) {
    return <MessageAlert message={isTokensError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isTokensLoading || isUiConfigLoading) {
    return <Loading />
  }

  return (
    <Container sx={{ my: 2 }}>
      {healthCheck ? (
        <Stack spacing={4}>
          <Box display='flex'>
            <Box ml='auto'>
              <Restricted action='createInferenceService' fallback={<Button disabled>Create Service</Button>}>
                <Button variant='outlined' onClick={handleCreateNewInferenceService}>
                  Create Service
                </Button>
              </Restricted>
            </Box>
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
        </Stack>
      )}
      <MessageAlert message={errorMessage} severity='error' />
    </Container>
  )
}
