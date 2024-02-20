import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Dialog, DialogActions, DialogTitle, Tab } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import { useEffect, useState } from 'react'
import { TokenInterface } from 'types/v2/types'

type TokenTabProps = {
  token?: TokenInterface
}

export default function TokenTabs({ token }: TokenTabProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showValue, setShowValue] = useState('1')
  // const [showAccessKey, setShowAccessKey] = useState(false)
  // const [showSecretKey, setShowSecretKey] = useState(false)

  useEffect(() => {
    if (token) setOpen(true)
  }, [token])

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=personal')
  }

  const handleChange = (event, newValue) => {
    setShowValue(newValue)
  }

  // replace existing popup, with a larger on of tabbed items
  // have an icon for each tab
  // make sure tabbing is implemented for accessibility

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>Token Created</DialogTitle>
      <TabContext value={showValue}>
        <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 224 }}>
          <TabList
            orientation='vertical'
            value={showValue}
            onChange={handleChange}
            aria-label='Vertical tabs example'
            sx={{ borderRight: 1, borderColor: 'divider' }}
            selectionFollowsFocus
          >
            <Tab label='Item One' value='1' />
            <Tab label='Item Two' value='2' />
            <Tab label='Item Three' value='3' />
          </TabList>
          <TabPanel value='1'>Item One </TabPanel>
          <TabPanel value='2'>Item Two </TabPanel>
          <TabPanel value='3'>Item Three </TabPanel>
        </Box>
      </TabContext>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
