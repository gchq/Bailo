import { DialogContent, Grid, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/v2/types'

type PodmanLoginProps = {
  token: TokenInterface
}
export default function PodmanLogin({ token }: PodmanLoginProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const theme = useTheme()

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {isUiConfigLoading && <Loading />}
      <DialogContent sx={{ overflow: 'auto' }}>
        <Stack spacing={2} direction={{ md: 'column' }}>
          <Typography fontWeight='bold'>1. Run Podman login:</Typography>
          <Typography>Enter the following command on the command line:</Typography>
          <Grid container spacing={0} alignItems='center'>
            {!token.secretKey && <Typography color={theme.palette.error.main}>Could not find Secret Key</Typography>}
            {token.secretKey && (
              <TokenCommand
                token={token}
                command={`podman login -u="<access-key>" -p="<secret-key>" ${uiConfig?.registry.host}`}
              />
            )}
          </Grid>
        </Stack>
      </DialogContent>
    </>
  )
}
