import { Visibility, VisibilityOff } from '@mui/icons-material'
import DownloadIcon from '@mui/icons-material/Download'
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DialogContent, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import { dockerConfigTemplate } from 'src/settings/authentication/configTemplates'
import { TokenInterface } from 'types/v2/types'

import dockerConfig from './dockerConfig.json'

type dockerConfigProps = {
  token: TokenInterface
}

export default function DockerConfig({ token }: dockerConfigProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [open, setOpen] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  function downloadOrSaveTextFile(text, name) {
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

  function handleOnChange() {
    const currentState = open
    setOpen(!currentState)
  }

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
          <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
          <Typography>First, download the Docker credentials for the application token: </Typography>
          {/* TODO */}
          <Grid container spacing={0} alignItems='center'>
            <Typography
              onClick={() => downloadOrSaveTextFile(JSON.stringify([dockerConfig], replacer, 2), 'test-auth.yaml')}
              sx={{ cursor: 'pointer' }}
            >
              <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
                <DownloadIcon color='primary' sx={{ mr: 0.5 }} />
                {`Download <key-name>-auth.yml `}
              </Stack>
            </Typography>
          </Grid>
          <Grid container spacing={0} alignItems='center'>
            <Typography onClick={handleOnChange} sx={{ cursor: 'pointer' }}>
              <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
                {open ? (
                  <Tooltip title='Show less' placement='bottom'>
                    <ExpandLessIcon color='primary' sx={{ mr: 0.5 }} />
                  </Tooltip>
                ) : (
                  <Tooltip title='Show more' placement='bottom'>
                    <ExpandMoreIcon color='primary' sx={{ mr: 0.5 }} />
                  </Tooltip>
                )}
                {`View <key-name>-auth.yml`}
              </Stack>
            </Typography>
            {open && (
              <CodeSnippetBox>
                {dockerConfigTemplate(
                  `${uiConfig?.registry.host}`,
                  `${showKeys ? token.accessKey : 'xxxxxxxxxx'}`,
                  `${showKeys ? token.secretKey : 'xxxxxxxxxxxxxxxxxxxxx'}`,
                )}
                <Tooltip title={`${showKeys ? 'Hide' : 'Show'} keys`} placement='top'>
                  <IconButton
                    onClick={handleToggleKeyVisibility}
                    aria-label={`${showKeys ? 'Hide' : 'Show'} keys`}
                    data-test='toggleKeyVisibilityButton'
                  >
                    {showKeys ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              </CodeSnippetBox>
            )}
          </Grid>
          <Typography fontWeight='bold'>Step 2: Write to disk:</Typography>
          <Typography>Second, place the file in the Docker configuration Directory.</Typography>
          <Grid container spacing={0} alignItems='center'>
            <Typography sx={{ fontWeight: 'bold' }} mr={0.5}>
              Note:
            </Typography>{' '}
            This will overwrite existing credentials:
          </Grid>
          {/* TODO */}
          <Grid container spacing={0} alignItems='center'>
            <Typography
              onClick={() => downloadOrSaveTextFile(JSON.stringify([dockerConfig], replacer, 2), 'test-auth.json')}
              sx={{ cursor: 'pointer' }}
            >
              <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
                <DriveFileMoveIcon color='primary' sx={{ mr: 0.5 }} />
                {`mv <key-name>-auth.json ~/.docker/config.json`}
              </Stack>
            </Typography>
          </Grid>
        </Stack>
      </DialogContent>
    </>
  )
}
