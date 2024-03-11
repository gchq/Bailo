import { Visibility, VisibilityOff } from '@mui/icons-material'
import DownloadIcon from '@mui/icons-material/Download'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import {
  kubeImagePullSecretsConfigExample,
  KubernetesSecretsConfigTemplate,
} from 'src/settings/authentication/configTemplates'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/v2/types'
import { toKebabCase } from 'utils/stringUtils'

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
      <Stack spacing={2} direction='column' alignItems='flex-start'>
        <Typography fontWeight='bold'>Step 1: Download Secret</Typography>
        <Typography>First, download the Kubernetes pull secret for your personal access token.</Typography>
        <Button
          onClick={() =>
            downloadOrSaveTextFile(
              JSON.stringify([kubeConfig], replacer, 2),
              `${toKebabCase(token.description)}-auth.yml`,
            )
          }
        >
          <DownloadIcon color='primary' sx={{ mr: 1 }} />
          {`Download ${toKebabCase(token.description)}-auth.yml`}
        </Button>
        <Button onClick={handleOnChange}>
          {open ? (
            <Tooltip title='Show less' placement='bottom'>
              <ExpandLessIcon color='primary' sx={{ mr: 1 }} />
            </Tooltip>
          ) : (
            <Tooltip title='Show more' placement='bottom'>
              <ExpandMoreIcon color='primary' sx={{ mr: 1 }} />
            </Tooltip>
          )}
          {`View ${toKebabCase(token.description)}-auth.yml`}
        </Button>
        {open && (
          <CodeSnippetBox>
            {KubernetesSecretsConfigTemplate(
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
        <Typography fontWeight='bold'>Step 2: Submit</Typography>
        <Typography>Second, submit the secret to the cluster using this command:</Typography>
        <TokenCommand
          disableVisibilityToggle
          token={token}
          command={`kubectl create -f ${toKebabCase(token.description)}-secret.yml --namespace=<namespace>`}
        />
        <Typography fontWeight='bold'>Step 3: Update Kubernetes configuration</Typography>
        <Typography>
          Finally, add a reference to the secret to your Kubernetes pod config via an
          <Grid container spacing={0} alignItems='center'>
            <Typography sx={{ fontWeight: 'bold' }} mr={0.2} color={'primary'}>
              imagePullSecrets
            </Typography>{' '}
            field. For example:
          </Grid>
        </Typography>
        <CodeSnippetBox>{kubeImagePullSecretsConfigExample(`${toKebabCase(token.description)}`)}</CodeSnippetBox>
      </Stack>
    </>
  )
}
