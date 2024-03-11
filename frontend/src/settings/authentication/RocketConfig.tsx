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
import { rktConfigTemplate } from 'src/settings/authentication/configTemplates'
import { TokenInterface } from 'types/v2/types'
import { toKebabCase } from 'utils/stringUtils'

import rktConfig from './rktConfig.json'

type rktConfigProps = {
  token: TokenInterface
}

export default function RocketConfig({ token }: rktConfigProps) {
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
    if (key === 'domains') return [`${uiConfig?.registry.host}`]
    if (key === 'user') return `${token.accessKey}`
    if (key === 'password') return `${token.secretKey}`
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
      <DialogContent sx={{ overflow: 'auto' }}>
        <Stack spacing={2} direction={{ xs: 'column' }}>
          <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
          <Typography>First, download the rkt credentials file for the personal access token:</Typography>
          <Grid container spacing={0} alignItems='center'>
            <Typography
              onClick={() => downloadOrSaveTextFile(JSON.stringify([rktConfig], replacer, 2), 'test-auth.yaml')}
              sx={{ cursor: 'pointer' }}
            >
              <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
                <DownloadIcon color='primary' sx={{ mr: 0.5 }} />
                {`Download ${toKebabCase(token.description)}-auth.yml `}
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
                {`View ${toKebabCase(token.description)}-auth.yml`}
              </Stack>
            </Typography>
            {open && (
              <CodeSnippetBox>
                {rktConfigTemplate(
                  `${uiConfig?.registry.host}`,
                  `${showKeys ? token.accessKey : 'xxxxxxxxxx'}`,
                  `${showKeys ? token.secretKey : 'xxxxxxxxxxxxxxxxxxxxx'}`,
                )}
                <Tooltip title={`${showKeys ? 'Hide' : 'Show'} keys`} placement='left'>
                  <IconButton
                    sx={{ position: 'absolute', top: 0, right: 0 }}
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
          <Typography fontWeight='bold'>Step 2: Write to disk</Typography>
          <Typography>Second, place the file in the rkt configuration directory:</Typography>
          <Grid container spacing={0} alignItems='center'>
            <Typography
              onClick={() => downloadOrSaveTextFile(JSON.stringify([rktConfig], replacer, 2), 'test-auth.json')}
              sx={{ cursor: 'pointer' }}
            >
              <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
                <DriveFileMoveIcon color='primary' sx={{ mr: 0.5 }} />
                {`mv ${toKebabCase(token.description)}-auth.json /etc/rkt/auth.d/`}
              </Stack>
            </Typography>
          </Grid>
        </Stack>
      </DialogContent>
    </>
  )
}
