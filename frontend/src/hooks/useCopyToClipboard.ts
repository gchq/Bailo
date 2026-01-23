import { SnackbarOrigin } from 'notistack'

import useNotification from './useNotification'

const useCopyToClipboard = () => {
  const sendNotification = useNotification()

  const copyToClipboard = async (
    textToCopy: string,
    notificationText: string,
    fallbackErrorMessage: string,
    anchorOrigin?: SnackbarOrigin,
  ) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      sendNotification({
        variant: 'success',
        msg: notificationText,
        anchorOrigin,
      })
    } catch (error) {
      sendNotification({
        variant: 'error',
        msg: error instanceof Error ? error.message : fallbackErrorMessage,
        anchorOrigin,
      })
    }
  }

  return copyToClipboard
}

export default useCopyToClipboard
