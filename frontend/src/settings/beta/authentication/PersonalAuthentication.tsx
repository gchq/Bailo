import { Delete } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { deleteUserToken, useGetUserTokens } from 'actions/user'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/v2/types'
import { getErrorMessage } from 'utils/fetcher'

export default function PersonalAuthentication() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { tokens, isTokensLoading, isTokensError, mutateTokens } = useGetUserTokens()

  const handleDeleteToken = useCallback(
    async (accessKey: TokenInterface['accessKey']) => {
      const response = await deleteUserToken(accessKey)

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response))
      } else {
        mutateTokens()
      }
    },
    [mutateTokens],
  )

  const tokenList = useMemo(
    () =>
      tokens.map((token, index) => (
        <Fragment key={token.accessKey}>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography>{token.description}</Typography>
            <Tooltip title='Delete token'>
              <IconButton
                color='primary'
                onClick={() => handleDeleteToken(token.accessKey)}
                aria-label='delete access key'
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Stack>
          {index !== tokens.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 2 }} />}
        </Fragment>
      )),
    [handleDeleteToken, tokens],
  )

  const handleAddToken = () => {
    setIsLoading(true)
    router.push('/beta/settings/personal-access-tokens/new')
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={{ xs: 'center', sm: 'space-between' }}
        alignItems='center'
        sx={{ pb: 2 }}
      >
        <Typography fontWeight='bold' mb={1}>
          Personal Access Tokens
        </Typography>
        <LoadingButton variant='outlined' loading={isLoading} onClick={handleAddToken}>
          Add token
        </LoadingButton>
      </Stack>
      <MessageAlert message={isTokensError?.info.message || errorMessage} severity='error' />
      {isTokensLoading && <Loading />}
      {tokenList}
    </Box>
  )
}
