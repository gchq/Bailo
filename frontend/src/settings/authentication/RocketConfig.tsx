import DownloadIcon from '@mui/icons-material/Download'
import { DialogContent, Grid, Stack, Typography } from '@mui/material'
// import { useGetUiConfig } from 'actions/uiConfig'
// import { TokenInterface } from 'types/v2/types'

// import rktConfig from './rktConfig.json'

// type rktConfigProps = {
//   token: TokenInterface
// }

export default function RocketConfig() {
  // const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  // const data = rktConfig
  // const modifiedConfig = {
  //   ...data,
  //   domains: data.domains[0].replace('${registry-url}', `${uiConfig?.registry.host}`),
  //   user: data.credentials.user.replace('${access_key}', `${token.accessKey}`),
  //   password: data.credentials.password.replace('${secret_key}', `${token.secretKey}`),
  // }
  return (
    <DialogContent
      sx={{
        width: '600px',
        height: '400px',
        overflow: 'auto',
      }}
    >
      <Stack spacing={2} direction={{ xs: 'column' }}>
        <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
        <Typography>First, download the rkt credentials file for the personal access token:</Typography>
        {/* TODO */}
        <Grid container spacing={0} alignItems='center'>
          <DownloadIcon color='primary' sx={{ mr: 0.5 }} />
          <Typography>{`<key-name>-auth.yml `}</Typography>
        </Grid>
        <Typography>{'View <key-name>-auth.yml'}</Typography>
        <Typography fontWeight='bold'>Step 2: Write to disk</Typography>
        <Typography>Second, place the file in the rkt configuration directory:</Typography>
        {/* TODO */}
        <Typography>{`mv <key-name>-auth.json /etc/rkt/auth.d/`}</Typography>
      </Stack>
    </DialogContent>
  )
}
