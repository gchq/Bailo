import { Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import SplitButton from 'src/common/SplitButton'
import MessageAlert from 'src/MessageAlert'
import CodeSnippet from 'src/settings/authentication/CodeSnippet'
import {
  kubeImagePullSecretsConfigExample,
  kubernetesSecretsConfigTemplate,
} from 'src/settings/authentication/configTemplates'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'
import { downloadFile } from 'utils/fileUtils'
import { toKebabCase } from 'utils/stringUtils'

import kubeConfig from './kubernetesConfig.json'

type KubernetesSecretProps = {
  token: TokenInterface
}

export default function KubernetesSecret({ token }: KubernetesSecretProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  const secretFileName = useMemo(() => `${toKebabCase(token.description)}-k8s-secret.yml`, [token.description])

  function replacer(key: string | string[], value: string) {
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
      <Stack spacing={4} direction='column'>
        <Stack spacing={2} direction='column' alignItems='flex-start'>
          <Typography fontWeight='bold'>Step 1: Download Secret</Typography>
          <Typography>First, download the Kubernetes pull secret for your personal access token.</Typography>
          <SplitButton
            options={[`${showFilePreview ? 'Close preview' : 'Preview file'}`]}
            onPrimaryButtonClick={() => downloadFile(JSON.stringify([kubeConfig], replacer, 2), secretFileName)}
            onMenuItemClick={() => setShowFilePreview(!showFilePreview)}
          >
            Download
          </SplitButton>
          {showFilePreview && (
            <CodeSnippet
              fileName={secretFileName}
              showKeys={showKeys}
              onVisibilityChange={(value) => setShowKeys(value)}
              onClose={() => setShowFilePreview(false)}
            >
              {kubernetesSecretsConfigTemplate(
                `${token.description}`,
                `${uiConfig?.registry.host}`,
                `${showKeys ? token.accessKey : 'xxxxxxxxxx'}`,
                `${showKeys ? token.secretKey : 'xxxxxxxxxxxxxxxxxxxxx'}`,
              )}
            </CodeSnippet>
          )}
        </Stack>
        <Stack spacing={2} direction='column' alignItems='flex-start'>
          <Typography fontWeight='bold'>Step 2: Submit</Typography>
          <Typography>Second, submit the secret to the cluster using this command:</Typography>
          <TokenCommand
            disableVisibilityToggle
            token={token}
            command={`kubectl create -f ${secretFileName} --namespace=<namespace>`}
          />
        </Stack>
        <Stack spacing={2} direction='column' alignItems='flex-start'>
          <Typography fontWeight='bold'>Step 3: Update Kubernetes configuration</Typography>
          <Typography>
            Finally, add a reference to the secret to your Kubernetes pod config via an
            <Typography component='span' fontWeight='bold'>
              {' imagePullSecrets '}
            </Typography>
            field. For example:
          </Typography>
          <CodeSnippet disableVisibilityButton disableCloseButton>
            {kubeImagePullSecretsConfigExample(`${toKebabCase(token.description)}`)}
          </CodeSnippet>
        </Stack>
      </Stack>
    </>
  )
}
