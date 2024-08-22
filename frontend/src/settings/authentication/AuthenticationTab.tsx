import { Delete } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { deleteUserToken, useGetUserTokens } from 'actions/user'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

export default function AuthenticationTab() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [deleteTokenErrorMessage, setDeleteTokenErrorMessage] = useState('')
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [tokenToDelete, setTokenToDelete] = useState('')

  const { tokens, isTokensLoading, isTokensError, mutateTokens } = useGetUserTokens()

  const handleOpenConfirmationDialog = useCallback((accessKey: TokenInterface['accessKey']) => {
    setTokenToDelete(accessKey)
    setIsConfirmationDialogOpen(true)
  }, [])

  const tokenList = useMemo(
    () =>
      tokens.length > 0 && !isTokensLoading ? (
        tokens.reverse().map((token, index) => (
          <Fragment key={token.accessKey}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography>{token.description}</Typography>
              <Box pl={1}>
                <Typography variant='caption' mr={1}>
                  Created on
                  <Typography variant='caption' fontWeight='bold'>
                    {` ${formatDateString(token.createdAt)}`}
                  </Typography>
                </Typography>
                <Tooltip title='Delete token'>
                  <IconButton
                    color='primary'
                    onClick={() => handleOpenConfirmationDialog(token.accessKey)}
                    aria-label='delete access key'
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
            {index !== tokens.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 2 }} />}
          </Fragment>
        ))
      ) : (
        <EmptyBlob text='No tokens found' />
      ),
    [handleOpenConfirmationDialog, isTokensLoading, tokens],
  )

  const handleAddToken = () => {
    setIsLoading(true)
    router.push('/settings/personal-access-tokens/new')
  }

  const handleDeleteToken = async () => {
    const response = await deleteUserToken(tokenToDelete)

    if (!response.ok) {
      setDeleteTokenErrorMessage(await getErrorMessage(response))
    } else {
      mutateTokens()
      handleCloseDialog()
    }
  }

  const handleCloseDialog = () => {
    setDeleteTokenErrorMessage('')
    setTokenToDelete('')
    setIsConfirmationDialogOpen(false)
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
      <MessageAlert message={isTokensError?.info.message} severity='error' />
      {isTokensLoading && <Loading />}
      {tokenList}
      <ConfirmationDialogue
        title='Delete Token'
        open={isConfirmationDialogOpen}
        errorMessage={deleteTokenErrorMessage}
        onConfirm={handleDeleteToken}
        onCancel={handleCloseDialog}
      />
    </Box>
  )
}
