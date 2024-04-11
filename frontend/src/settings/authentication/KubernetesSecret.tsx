import { Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import SplitButton from 'src/common/SplitButton'
import MessageAlert from 'src/MessageAlert'
import CodeSnippet from 'src/settings/authentication/CodeSnippet'
import {
  getKubernetesImagePullSecretsExampleConfig,
  getKubernetesSecretConfig,
} from 'src/settings/authentication/configTemplates'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'
import { downloadFile } from 'utils/fileUtils'
import { toKebabCase } from 'utils/stringUtils'

type KubernetesSecretProps = {
  token: TokenInterface
}

export default function KubernetesSecret({ token }: KubernetesSecretProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [showFilePreview, setShowFilePreview] = useState(false)

  const configFileName = useMemo(() => `${toKebabCase(token.description)}-secret.yml`, [token.description])

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading || !uiConfig) {
    return <Loading />
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2} alignItems='flex-start'>
        <Typography fontWeight='bold'>Step 1: Download Secret</Typography>
        <Typography>First, download the Kubernetes pull secret for your personal access token.</Typography>
        <SplitButton
          options={[`${showFilePreview ? 'Close file preview' : 'Preview file'}`]}
          onPrimaryButtonClick={() =>
            downloadFile(
              getKubernetesSecretConfig(token.description, uiConfig.registry.host, token.accessKey, token.secretKey),
              configFileName,
            )
          }
          onMenuItemClick={() => setShowFilePreview(!showFilePreview)}
        >
          {`Download ${configFileName}`}
        </SplitButton>
        {showFilePreview && (
          <CodeSnippet disableVisibilityButton fileName={configFileName} onClose={() => setShowFilePreview(false)}>
            {getKubernetesSecretConfig(token.description, uiConfig.registry.host, token.accessKey, token.secretKey)}
          </CodeSnippet>
        )}
      </Stack>
      <Stack spacing={2} direction='column' alignItems='flex-start'>
        <Typography fontWeight='bold'>Step 2: Submit</Typography>
        <Typography>Second, submit the secret to the cluster using this command:</Typography>
        <TokenCommand
          disableVisibilityToggle
          token={token}
          command={`kubectl create -f ${configFileName} --namespace=<namespace>`}
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
          {getKubernetesImagePullSecretsExampleConfig(uiConfig.registry.host, configFileName)}
        </CodeSnippet>
      </Stack>
    </Stack>
  )
}
