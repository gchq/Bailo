import { Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import SplitButton from 'src/common/SplitButton'
import MessageAlert from 'src/MessageAlert'
import CodeSnippet from 'src/settings/authentication/CodeSnippet'
import { dockerConfigTemplate } from 'src/settings/authentication/configTemplates'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'
import { HIDDEN_TOKEN_ACCESS_KEY, HIDDEN_TOKEN_SECRET_KEY } from 'utils/constants'
import { downloadFile } from 'utils/fileUtils'
import { toKebabCase } from 'utils/stringUtils'

import dockerConfig from './dockerConfig.json'

type DockerConfigurationProps = {
  token: TokenInterface
}

export default function DockerConfiguration({ token }: DockerConfigurationProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  const configFileName = useMemo(() => `${toKebabCase(token.description)}-docker-auth.yml`, [token.description])

  function replacer(key: string | string[], value: string) {
    if (key === 'auths') {
      return JSON.parse(
        `{"${uiConfig?.registry.host}": {"username": "${token.accessKey}","password": "${token.secretKey}","auth": "BASE64(${token.accessKey}:${token.secretKey})"}}`,
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
          <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
          <Typography>First, download the Docker credentials for the application token: </Typography>
          <SplitButton
            options={[`${showFilePreview ? 'Close preview' : 'Preview file'}`]}
            onPrimaryButtonClick={() => downloadFile(JSON.stringify([dockerConfig], replacer, 2), configFileName)}
            onMenuItemClick={() => setShowFilePreview(!showFilePreview)}
          >
            Download
          </SplitButton>
          {showFilePreview && (
            <CodeSnippet
              fileName={configFileName}
              showKeys={showKeys}
              onVisibilityChange={(value) => setShowKeys(value)}
              onClose={() => setShowFilePreview(false)}
            >
              {dockerConfigTemplate(
                `${uiConfig?.registry.host}`,
                `${showKeys ? token.accessKey : HIDDEN_TOKEN_ACCESS_KEY}`,
                `${showKeys ? token.secretKey : HIDDEN_TOKEN_SECRET_KEY}`,
              )}
            </CodeSnippet>
          )}
        </Stack>
        <Stack spacing={2} direction='column' alignItems='flex-start'>
          <Typography fontWeight='bold'>Step 2: Write to disk:</Typography>
          <Typography>Second, place the file in the Docker configuration Directory.</Typography>
          <MessageAlert message='Note: This will overwrite existing credentials.' severity='warning' />
          {/* TODO me - check in with Alex. Should this be a json or yaml file? */}
          <TokenCommand disableVisibilityToggle token={token} command={`mv ${configFileName} ~/.docker/config.yml`} />
        </Stack>
      </Stack>
    </>
  )
}
