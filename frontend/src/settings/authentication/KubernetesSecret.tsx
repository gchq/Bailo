import { Stack, Typography } from '@mui/material'
import { useContext, useMemo, useState } from 'react'
import SplitButton from 'src/common/SplitButton'
import UiConfigContext from 'src/contexts/uiConfigContext'
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
  const uiConfig = useContext(UiConfigContext)
  const [showFilePreview, setShowFilePreview] = useState(false)

  const configFileName = useMemo(() => `${toKebabCase(token.description)}-secret.yml`, [token.description])
  const secretName = useMemo(() => `${toKebabCase(token.description)}`, [token.description])

  return (
    <Stack spacing={4}>
      <Stack
        spacing={2}
        sx={{
          alignItems: 'flex-start',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
          }}
        >
          Step 1: Download Secret
        </Typography>
        <Typography>First, download the Kubernetes pull secret for your personal access token.</Typography>
        <SplitButton
          aria-label='download Kubernetes pull secret'
          options={[`${showFilePreview ? 'Close file preview' : 'Preview file'}`]}
          onPrimaryButtonClick={() =>
            downloadFile(
              getKubernetesSecretConfig(
                token.description,
                uiConfig.registry.host,
                token.accessKey,
                token.secretKey,
                secretName,
              ),
              configFileName,
            )
          }
          onMenuItemClick={() => setShowFilePreview(!showFilePreview)}
        >
          {`Download ${configFileName}`}
        </SplitButton>
        {showFilePreview && (
          <CodeSnippet disableVisibilityButton fileName={configFileName} onClose={() => setShowFilePreview(false)}>
            {getKubernetesSecretConfig(
              token.description,
              uiConfig.registry.host,
              token.accessKey,
              token.secretKey,
              secretName,
            )}
          </CodeSnippet>
        )}
      </Stack>
      <Stack
        spacing={2}
        direction='column'
        sx={{
          alignItems: 'flex-start',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
          }}
        >
          Step 2: Submit
        </Typography>
        <Typography>Second, submit the secret to the cluster using this command:</Typography>
        <TokenCommand
          disableVisibilityToggle
          token={token}
          command={`kubectl create -f ${configFileName} --namespace=<namespace>`}
        />
      </Stack>
      <Stack
        spacing={2}
        direction='column'
        sx={{
          alignItems: 'flex-start',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
          }}
        >
          Step 3: Update Kubernetes configuration
        </Typography>
        <Typography>
          Finally, add a reference to the secret to your Kubernetes pod config via an
          <Typography
            component='span'
            sx={{
              fontWeight: 'bold',
            }}
          >
            {' imagePullSecrets '}
          </Typography>
          field. For example:
        </Typography>
        <CodeSnippet disableVisibilityButton disableCloseButton>
          {getKubernetesImagePullSecretsExampleConfig(uiConfig.registry.host, token.description)}
        </CodeSnippet>
      </Stack>
    </Stack>
  )
}
