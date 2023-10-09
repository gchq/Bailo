import { Box, Button, Divider, Stack, Tab, Tabs, Typography } from '@mui/material'
import { grey } from '@mui/material/colors/'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { ReactElement, SyntheticEvent, useEffect, useState } from 'react'

export interface PageTab {
  title: string
  path: string
  view: ReactElement
  disabled?: boolean
}

export default function PageWithTabs({
  title,
  tabs,
  actionButtonTitle = '',
  displayActionButton = false,
  actionButtonOnClick,
}: {
  title
  tabs: PageTab[]
  actionButtonTitle?: string
  displayActionButton?: boolean
  actionButtonOnClick?: () => void
}) {
  const [currentTab, setCurrentTab] = useState('')

  const router = useRouter()

  const { tab } = router.query

  useEffect(() => {
    tab && tabs.length ? setCurrentTab(tab as string) : setCurrentTab(tabs[0].path)
  }, [tab, setCurrentTab, tabs])

  const handleChange = (_event: SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue)
    router.replace({
      query: { ...router.query, tab: newValue },
    })
  }

  return (
    <>
      <Box>
        <Stack
          direction='row'
          divider={<Divider flexItem orientation='vertical' />}
          alignItems='center'
          spacing={2}
          sx={{ p: 2 }}
        >
          <Typography component='h1' color='primary' variant='h6'>
            {title}
          </Typography>
          {displayActionButton && (
            <Button variant='contained' onClick={actionButtonOnClick}>
              {actionButtonTitle}
            </Button>
          )}
        </Stack>
        <Tabs
          value={currentTab}
          onChange={handleChange}
          aria-label='Tabbed view'
          indicatorColor='secondary'
          scrollButtons='auto'
          variant='scrollable'
        >
          {tabs.map((tab: PageTab) => {
            return <Tab key={tab.title} label={tab.title} disabled={tab.disabled} value={tab.path} />
          })}
        </Tabs>
      </Box>
      <Box sx={{}}>
        {tabs.map((tab: PageTab) => {
          return (
            <CustomTabPanel key={tab.title} currentTab={currentTab} tabKey={tab.path}>
              {tab.view}
            </CustomTabPanel>
          )
        })}
      </Box>
    </>
  )
}

interface TabPanelProps {
  children?: ReactElement
  tabKey: string
  currentTab: string
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, tabKey, currentTab, ...other } = props
  const theme = useTheme()

  return (
    <div role='tabpanel' hidden={currentTab !== tabKey} {...other}>
      {currentTab === tabKey && (
        <Box
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? 'white' : grey[800],
            p: 2,
            mb: 2,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  )
}
