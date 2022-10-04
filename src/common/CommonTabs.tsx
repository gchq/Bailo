import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useTheme } from '@mui/material/styles'
import React, { useEffect } from 'react'

function a11yProps(index: any) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

const getTitle = (title: any, index: any) => {
  let titleNoFullStop = title
  if (title[title.length - 1] === '.') {
    titleNoFullStop = title.slice(0, -1)
  }
  return `${titleNoFullStop} #${index + 1}`
}

export default function CommonTabs({ tabs, tabName }: { tabs: any; tabName: any }) {
  const [value, setValue] = React.useState(0)

  const theme = useTheme()

  useEffect(() => {
    if (tabs.length === 1) {
      setValue(0)
    }
  }, [tabs])

  const handleChange = (_event: any, newValue: any) => {
    setValue(newValue)
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'white' }}>
      <AppBar position='static'>
        <Tabs
          indicatorColor='secondary'
          textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
          value={value}
          onChange={handleChange}
          aria-label={`${tabName} tab bar`}
        >
          {tabs.map((tab: any, index: any) => (
            <Tab
              label={tabName !== undefined ? getTitle(tabName, index) : tab.name}
              key={`${tabName} ${index + 1}`}
              sx={{ flexGrow: 1, backgroundColor: 'white', maxWidth: 275 }}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </AppBar>
    </Box>
  )
}
