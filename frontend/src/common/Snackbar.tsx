// To USE:
// import (change relative path):
// import useNotification from '../../src/common/Snackbar'
// Use once in file:
// const sendNotification = useNotification()
// Use for each notification to send:
// sendNotification({ variant: 'success/info/warning/error', msg: 'Notification message' })

import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'
import { SnackbarKey, useSnackbar, VariantType } from 'notistack'
import React, { useEffect, useState } from 'react'

interface SnackbarConfig {
  msg: string
  variant?: VariantType
}

const useNotification = () => {
  const [conf, setConf] = useState<SnackbarConfig | undefined>(undefined)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  useEffect(() => {
    const action = (key: SnackbarKey) => (
      <IconButton
        onClick={() => {
          closeSnackbar(key)
        }}
      >
        <CloseIcon />
      </IconButton>
    )
    if (conf) {
      enqueueSnackbar(conf.msg, {
        variant: conf.variant ?? 'info',
        autoHideDuration: 5000,
        action,
      })
    }
  }, [conf, enqueueSnackbar, closeSnackbar])

  return setConf
}

export default useNotification
