import { Stack, Typography } from '@mui/material'
import { useContext } from 'react'
import UiConfigContext from 'src/contexts/uiConfigContext'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'

type PodmanLoginProps = {
  token: TokenInterface
}

export default function PodmanLogin({ token }: PodmanLoginProps) {
  const uiConfig = useContext(UiConfigContext)

  return (
    <Stack spacing={2}>
      <Typography
        sx={{
          fontWeight: 'bold',
        }}
      >
        1. Run Podman login:
      </Typography>
      <Typography>Enter the following command on the command line:</Typography>
      <TokenCommand
        token={token}
        command={`podman login -u="<access-key>" -p="<secret-key>" ${uiConfig.registry.host}`}
      />
    </Stack>
  )
}
