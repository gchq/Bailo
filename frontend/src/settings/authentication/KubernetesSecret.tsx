import DownloadIcon from '@mui/icons-material/Download'
import { DialogContent, Grid, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import { kubeImagePullSecretsConfigTemplate } from 'src/settings/authentication/configTemplates'
import CopyInputTextField from 'src/settings/authentication/CopyInputTextField'
import { TokenInterface } from 'types/v2/types'

import kubeConfig from './kubeConfig.json'

type kubeSecretProps = {
  token: TokenInterface
}

export default function KubernetesSecret({ token }: kubeSecretProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  function downloadTextFile(text, name) {
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
            <DownloadIcon
              color='primary'
              sx={{ mr: 0.5 }}
              onClick={() => downloadTextFile(JSON.stringify([kubeConfig], replacer, 2), 'test.yaml')}
            />
            <Typography>{`<key-name>-auth.yml `}</Typography>
          </Grid>
          <Typography>{`View <key-name>-auth.yml `}</Typography>
          <Typography fontWeight='bold'>Step 2: Submit</Typography>
          <Typography>Second, submit the secret to the cluster usign this command:</Typography>
          {/* TODO */}
          <CopyInputTextField text={`kubectl create -f <key-name>-secret.yml --namespace=NAMESPACEHERE`} />
          {/* TODO: need to find out the cause of the keys not being revealed when pasted */}
          <Typography fontWeight='bold'>Step 3: Update Kubernetes configuration</Typography>
          <Typography>
            Finally, add a reference to the secret to your Kubernetes pod config via an `imagePullSecrets` field, For
            example:
          </Typography>
          <CodeSnippetBox>{kubeImagePullSecretsConfigTemplate()}</CodeSnippetBox>
        </Stack>
      </DialogContent>
    </>
  )
}
