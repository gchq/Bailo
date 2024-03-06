//import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import { Box, Button, DialogContent, Grid, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import { rktConfigTemplate } from 'src/settings/authentication/configTemplates'
import { TokenInterface } from 'types/v2/types'

import rktConfig from './rktConfig.json'

type rktConfigProps = {
  token: TokenInterface
}

export default function RocketConfig({ token }: rktConfigProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [open, setOpen] = useState(false)

  function downloadTextFile(text, name) {
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
            <DownloadIcon color='primary' sx={{ mr: 0.5 }} />
            <Typography
              onClick={() => downloadTextFile(JSON.stringify([rktConfig], replacer, 2), 'test.yaml')}
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            >{`<key-name>-auth.yml `}</Typography>
          </Grid>
          <Typography
            onClick={() => setOpen(true)}
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              '&:hover': { color: '#000', backgroundColor: '#f1f1f1' },
            }}
          >
            {'View <key-name>-auth.yml'}
          </Typography>
          {open && (
            <CodeSnippetBox>
              {rktConfigTemplate(`${uiConfig?.registry.host}`, `${token.accessKey}`, `${token.secretKey}`)}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </Box>
            </CodeSnippetBox>
          )}
          <Typography fontWeight='bold'>Step 2: Write to disk</Typography>
          <Typography>Second, place the file in the rkt configuration directory:</Typography>
          {/* TODO */}
          <Typography>{`mv <key-name>-auth.json /etc/rkt/auth.d/`}</Typography>
        </Stack>
      </DialogContent>
    </>
  )
}
