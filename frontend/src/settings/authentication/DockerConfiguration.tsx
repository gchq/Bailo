import { Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import SplitButton from 'src/common/SplitButton'
import MessageAlert from 'src/MessageAlert'
import CodeSnippet from 'src/settings/authentication/CodeSnippet'
import { getDockerCredentialsConfig } from 'src/settings/authentication/configTemplates'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'
import { downloadFile } from 'utils/fileUtils'
import { toKebabCase } from 'utils/stringUtils'

type DockerConfigurationProps = {
  token: TokenInterface
}

export default function DockerConfiguration({ token }: DockerConfigurationProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [showFilePreview, setShowFilePreview] = useState(false)

  const configFileName = useMemo(() => `${toKebabCase(token.description)}-auth.json`, [token.description])

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading || !uiConfig) {
    return <Loading />
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2} alignItems='flex-start'>
        <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
        <Typography>First, download the Docker credentials for the application token: </Typography>
        <SplitButton
          options={[`${showFilePreview ? 'Close file preview' : 'Preview file'}`]}
          onPrimaryButtonClick={() =>
            downloadFile(
              getDockerCredentialsConfig(uiConfig.registry.host, token.accessKey, token.secretKey),
              configFileName,
            )
          }
          onMenuItemClick={() => setShowFilePreview(!showFilePreview)}
        >
          {`Download ${configFileName}`}
        </SplitButton>
        {showFilePreview && (
          <CodeSnippet disableVisibilityButton fileName={configFileName} onClose={() => setShowFilePreview(false)}>
            {getDockerCredentialsConfig(uiConfig.registry.host, token.accessKey, token.secretKey)}
          </CodeSnippet>
        )}
      </Stack>
      <Stack spacing={2} direction='column' alignItems='flex-start'>
        <Typography fontWeight='bold'>Step 2: Write to disk:</Typography>
        <Typography>Second, place the file in the Docker configuration Directory.</Typography>
        <MessageAlert message='Note: This will overwrite existing credentials.' severity='warning' />
        <TokenCommand disableVisibilityToggle token={token} command={`mv ${configFileName} ~/.docker/config.json`} />
      </Stack>
    </Stack>
  )
}
