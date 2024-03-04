import DownloadIcon from '@mui/icons-material/Download'
import { DialogContent, Grid, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/v2/types'

import rktConfig from './rktConfig.json'

type rktConfigProps = {
  token: TokenInterface
}

export default function RocketConfig({ token }: rktConfigProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  function downloadTextFile(text, name) {
    const a = document.createElement('a')
    const type = name.lowerCase().split('.').pop()
    a.href = URL.createObjectURL(new Blob([text], { type: `text/${type === 'txt' ? 'plain' : type}` }))
    a.download = name
    a.click()
  }
  function replacer(key, value) {
    if (key === 'domains') return [`${uiConfig?.registry.host}`]
    if (key === 'user') return `${token.accessKey}`
    if (key === 'password') return `${token.secretKey}`
    return value
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
          <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
          <Typography>First, download the rkt credentials file for the personal access token:</Typography>
          {/* TODO */}
          <Grid container spacing={0} alignItems='center'>
            <DownloadIcon
              color='primary'
              sx={{ mr: 0.5 }}
              onClick={() => downloadTextFile(JSON.stringify([rktConfig], replacer, 2), 'test.yaml')}
            />
            <Typography>{`<key-name>-auth.yml `}</Typography>
          </Grid>
          <Typography>{'View <key-name>-auth.yml'}</Typography>
          <Typography fontWeight='bold'>Step 2: Write to disk</Typography>
          <Typography>Second, place the file in the rkt configuration directory:</Typography>
          {/* TODO */}
          <Typography>{`mv <key-name>-auth.json /etc/rkt/auth.d/`}</Typography>
        </Stack>
      </DialogContent>
    </>
  )
}
