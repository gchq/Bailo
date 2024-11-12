import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import MessageAlert from 'src/MessageAlert'

export default function ModelExportAgreementText() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (!uiConfig || isUiConfigLoading) {
    return <Loading />
  }

  return <MarkdownDisplay>{uiConfig.modelMirror.export.disclaimer}</MarkdownDisplay>
}
