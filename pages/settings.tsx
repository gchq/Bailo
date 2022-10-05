import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useTheme } from '@mui/material'
import React, { useState } from 'react'
import Wrapper from 'src/Wrapper'
import { useGetCurrentUser } from '../data/user'
import SettingsProfileTab from '../src/settings/SettingsProfileTab'
import { lightTheme } from '../src/theme'

function TabPanel({ children, value, index, ...rest }) {
  return (
    <Box
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...rest}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  )
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

export default function Settings() {
  const [tab, setTab] = useState<number>(0)

  const { currentUser, isCurrentUserLoading } = useGetCurrentUser()
  const theme = useTheme() || lightTheme

  const onTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
  }

  return (
    <Wrapper title='Settings' page='settings'>
      <Box sx={{ bgcolor: 'background.paper' }}>
        <Tabs
          value={tab}
          onChange={onTabChange}
          sx={{ p: 2, borderRight: 1, borderColor: 'divider' }}
          textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
          indicatorColor='secondary'
        >
          <Tab label='Profile' {...a11yProps(0)} />
        </Tabs>
        <TabPanel value={tab} index={0}>
          {!isCurrentUserLoading && <SettingsProfileTab user={currentUser} />}
        </TabPanel>
      </Box>
    </Wrapper>
  )
}
