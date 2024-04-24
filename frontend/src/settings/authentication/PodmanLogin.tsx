import { Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'

type PodmanLoginProps = {
  token: TokenInterface
}

export default function PodmanLogin({ token }: PodmanLoginProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading || !uiConfig) {
    return <Loading />
  }

  return (
    <Stack spacing={2}>
      <Typography fontWeight='bold'>1. Run Podman login:</Typography>
      <Typography>Enter the following command on the command line:</Typography>
      <TokenCommand
        token={token}
        command={`podman login -u="<access-key>" -p="<secret-key>" ${uiConfig.registry.host}`}
      />
    </Stack>
  )
}
