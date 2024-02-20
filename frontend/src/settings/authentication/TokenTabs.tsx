import { LoadingButton } from '@mui/lab'
import { Box, Dialog, DialogActions, DialogTitle, Tab, Tabs, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import { useEffect, useState } from 'react'
import { TokenInterface } from 'types/v2/types'

type TokenTabProps = {
  token?: TokenInterface
}
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}
export default function TokenTabs({ token }: TokenTabProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showValue, setShowValue] = React.useState(0)
  // const [showAccessKey, setShowAccessKey] = useState(false)
  // const [showSecretKey, setShowSecretKey] = useState(false)

  useEffect(() => {
    if (token) setOpen(true)
  }, [token])

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=personal')
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setShowValue(newValue)
  }

  // replace existing popup, with a larger on of tabbed items
  // have an icon for each tab
  // make sure tabbing is implemented for accessibility

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
      <div
        role='tabpanel'
        hidden={value !== index}
        id={`vertical-tabpanel-${index}`}
        aria-labelledby={`vertical-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    )
  }

  function a11yProps(index: number) {
    return {
      id: `vertical-tab-${index}`,
      'aria-controls': `vertical-tabpanel-${index}`,
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>Token Created</DialogTitle>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 224 }}>
        <Tabs
          orientation='vertical'
          variant='scrollable'
          value={showValue}
          onChange={handleChange}
          aria-label='Vertical tabs example'
          sx={{ borderRight: 1, borderColor: 'divider' }}
          selectionFollowsFocus
        >
          <Tab label='Item One' {...a11yProps(0)} />
          <Tab label='Item Two' {...a11yProps(1)} />
          <Tab label='Item Three' {...a11yProps(2)} />
          <Tab label='Item Four' {...a11yProps(3)} />
        </Tabs>
        <TabPanel value={showValue} index={0}>
          Item One
        </TabPanel>
        <TabPanel value={showValue} index={1}>
          Item Two
        </TabPanel>
        <TabPanel value={showValue} index={2}>
          Item Three
        </TabPanel>
        <TabPanel value={showValue} index={3}>
          Item Four
        </TabPanel>
      </Box>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
