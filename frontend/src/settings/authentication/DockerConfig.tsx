import DownloadIcon from '@mui/icons-material/Download'
import { DialogContent, Grid, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/v2/types'

import dockerConfig from './dockerConfig.json'

type dockerConfigProps = {
  token: TokenInterface
}

export default function DockerConfig({ token }: dockerConfigProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  function downloadTextFile(text, name) {
    const a = document.createElement('a')
    const type = name.toLowerCase().split('.').pop()
    a.href = URL.createObjectURL(new Blob([text], { type: `text/${type === 'txt' ? 'plain' : type}` }))
    a.download = name
    a.click()
  }

  function replacer(key, value) {
    if (key === 'auths') {
      return JSON.parse(
        ` {"${uiConfig?.registry.host}": {"username": "${token.accessKey}","password": "${token.secretKey}","auth": "BASE64(${token.accessKey}:${token.secretKey})"}}`,
      )
    }
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
          <Typography>First, download the Docker credentials for the application token: </Typography>
          {/* TODO */}
          <Grid container spacing={0} alignItems='center'>
            <DownloadIcon
              color='primary'
              sx={{ mr: 0.5 }}
              onClick={() => downloadTextFile(JSON.stringify([dockerConfig], replacer, 2), 'test.yaml')}
            />
            <Typography>{`<key-name>-auth.yml `}</Typography>
          </Grid>
          <Typography>{`View <key-name>-auth.yml`}</Typography>
          <Typography fontWeight='bold'>Step 2: Write to disk:</Typography>
          <Typography>
            Second, place the file in the Docker configuration Directory. Note: This will overwrite existing
            credentials:
          </Typography>
          {/* TODO */}
          <Typography>{`mv <key-name>-auth.json ~/.docker/config.json`}</Typography>
        </Stack>
      </DialogContent>
    </>
  )
}
