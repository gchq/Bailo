import { Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import SplitButton from 'src/common/SplitButton'
import MessageAlert from 'src/MessageAlert'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import { rocketConfigTemplate } from 'src/settings/authentication/configTemplates'
import TokenCommand from 'src/settings/authentication/TokenCommand'
import { TokenInterface } from 'types/types'
import { downloadFile } from 'utils/fileUtils'
import { toKebabCase } from 'utils/stringUtils'

import rocketConfig from './rocketConfig.json'

type RocketConfigurationProps = {
  token: TokenInterface
}

export default function RocketConfiguration({ token }: RocketConfigurationProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  function replacer(key: string | string[], value: string) {
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
      <Stack spacing={4} direction='column'>
        <Stack spacing={2} direction='column' alignItems='flex-start'>
          <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
          <Typography>First, download the rkt credentials file for the personal access token:</Typography>
          <SplitButton
            options={['Preview file']}
            onPrimaryButtonClick={() =>
              downloadFile(JSON.stringify([rocketConfig], replacer, 2), `${toKebabCase(token.description)}-auth.yml`)
            }
            onMenuItemClick={() => setShowFilePreview(true)}
          >
            {`Download ${toKebabCase(token.description)}-auth.yml`}
          </SplitButton>
          {showFilePreview && (
            <CodeSnippetBox
              showKeys={showKeys}
              onShowKeysChange={(value) => setShowKeys(value)}
              onClose={() => setShowFilePreview(false)}
            >
              {rocketConfigTemplate(
                `${uiConfig?.registry.host}`,
                `${showKeys ? token.accessKey : 'xxxxxxxxxx'}`,
                `${showKeys ? token.secretKey : 'xxxxxxxxxxxxxxxxxxxxx'}`,
              )}
            </CodeSnippetBox>
          )}
        </Stack>
        <Stack spacing={2} direction='column' alignItems='flex-start'>
          <Typography fontWeight='bold'>Step 2: Write to disk</Typography>
          <Typography>Second, place the file in the rkt configuration directory:</Typography>
          <TokenCommand
            disableVisibilityToggle
            token={token}
            command={`mv ${toKebabCase(token.description)}-auth.json /etc/rkt/auth.d/`}
          />
        </Stack>
      </Stack>
    </>
  )
}