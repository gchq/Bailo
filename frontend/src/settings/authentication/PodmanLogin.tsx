import { Visibility, VisibilityOff } from '@mui/icons-material'
import { DialogContent, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CopyInputTextField from 'src/settings/authentication/CopyInputTextField'
import { TokenInterface } from 'types/v2/types'

type PodmanLoginProps = {
  token: TokenInterface
}
export default function PodmanLogin({ token }: PodmanLoginProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const theme = useTheme()
  const [showKeys, setShowKeys] = useState(false)

  const handleToggleKeyVisibility = () => {
    setShowKeys(!showKeys)
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {isUiConfigLoading && <Loading />}
      <DialogContent
        sx={{
          width: '600px',
          height: '400px',
          overflow: 'auto',
        }}
      >
        <Stack spacing={2} direction={{ xs: 'column' }}>
          <Typography fontWeight='bold'>1. Run Podman login:</Typography>
          <Typography>Enter the following command on the command line:</Typography>
          <Grid container spacing={0} alignItems='center'>
            {!token.secretKey && <Typography color={theme.palette.error.main}>Could not find Secret Key</Typography>}
            {token.secretKey && (
              <CopyInputTextField
                text={`podman login -u="${showKeys ? token.accessKey : 'xxxxxxxxxx'}" -p="${
                  showKeys ? token.secretKey : 'xxxxxxxxxxxxxxxxxxxxx'
                }" ${uiConfig?.registry.host}`}
              />
            )}
            <Tooltip title={`${showKeys ? 'Hide' : 'Show'} keys`} placement='top'>
              <IconButton
                onClick={handleToggleKeyVisibility}
                aria-label={`${showKeys ? 'Hide' : 'Show'} keys`}
                data-test='toggleKeyVisibilityButton'
              >
                {showKeys ? <VisibilityOff /> : <Visibility />}
                {/* TODO: need to find out the cause of the keys not being revealed when pasted
                ans: may not be possible due to textfield taking a set string value*/}
              </IconButton>
            </Tooltip>
          </Grid>
        </Stack>
      </DialogContent>
    </>
  )
}
