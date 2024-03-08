import { Visibility, VisibilityOff } from '@mui/icons-material'
import DownloadIcon from '@mui/icons-material/Download'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DialogContent, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import {
  kubeImagePullSecretsConfigExample,
  KubernetesSecretsConfigTemplate,
} from 'src/settings/authentication/configTemplates'
import CopyInputTextField from 'src/settings/authentication/CopyInputTextField'
import { TokenInterface } from 'types/v2/types'

import kubeConfig from './kubeConfig.json'

type kubeSecretProps = {
  token: TokenInterface
}

export default function KubernetesSecret({ token }: kubeSecretProps) {
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
    if (key === '.dockerconfigjson') {
      return JSON.parse(
        `{"auths": {"${uiConfig?.registry.host}": {"username": "${token.accessKey}","password": "${token.secretKey}","auth": "BASE64(${token.accessKey}:${token.secretKey})"}}}`,
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
          <Typography fontWeight='bold'>Step 1: Download Secret</Typography>
          <Typography>First, download the Kubernetes pull secret for your personal access token.</Typography>
          {/* TODO */}
          <Grid container spacing={0} alignItems='center'>
            <Typography
              onClick={() => downloadOrSaveTextFile(JSON.stringify([kubeConfig], replacer, 2), 'test-auth.yaml')}
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
                {` View <key-name>-auth.yml `}
              </Stack>
            </Typography>
            {open && (
              <CodeSnippetBox>
                {KubernetesSecretsConfigTemplate(
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
          <Typography fontWeight='bold'>Step 2: Submit</Typography>
          <Typography>Second, submit the secret to the cluster usign this command:</Typography>
          {/* TODO */}
          <CopyInputTextField text={`kubectl create -f <key-name>-secret.yml --namespace=NAMESPACEHERE`} />
          {/* TODO: need to find out the cause of the keys not being revealed when pasted */}
          <Typography fontWeight='bold'>Step 3: Update Kubernetes configuration</Typography>
          <Typography>
            Finally, add a reference to the secret to your Kubernetes pod config via an
            <Grid container spacing={0} alignItems='center'>
              <Typography sx={{ fontWeight: 'bold' }} mr={0.2} color={'primary'}>
                `imagePullSecrets`
              </Typography>{' '}
              field. For example:
            </Grid>
          </Typography>
          <CodeSnippetBox>{kubeImagePullSecretsConfigExample()}</CodeSnippetBox>
        </Stack>
      </DialogContent>
    </>
  )
}
