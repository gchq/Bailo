import { Box, Button, Divider, Stack, Tab, Tabs, Typography } from '@mui/material'
import { grey } from '@mui/material/colors/'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { ReactElement, SyntheticEvent, useContext, useEffect, useState } from 'react'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'

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
  requiredUrlParams = {},
}: {
  title: string
  tabs: PageTab[]
  actionButtonTitle?: string
  displayActionButton?: boolean
  actionButtonOnClick?: () => void
  requiredUrlParams?: ParsedUrlQuery
}) {
  const [currentTab, setCurrentTab] = useState(tabs[0].path)

  const router = useRouter()
  const { unsavedChanges, setUnsavedChanges, sendWarning } = useContext(UnsavedChangesContext)

  const { tab } = router.query

  useEffect(() => {
    tab ? setCurrentTab(tab as string) : setCurrentTab(tabs[0].path)
  }, [tab, setCurrentTab, tabs])

  function handleChange(_event: SyntheticEvent, newValue: string) {
    if (unsavedChanges) {
      if (sendWarning()) {
        continueNavigation(newValue)
      }
      // Do nothing if user does not confirm
    } else {
      continueNavigation(newValue)
    }
  }

  function continueNavigation(tab: string) {
    setCurrentTab(tab)
    setUnsavedChanges(false)
    router.replace({
      query: { ...requiredUrlParams, tab: tab },
    })
  }

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        divider={<Divider flexItem orientation='vertical' />}
        alignItems='center'
        spacing={{ sm: 2 }}
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
        value={currentTab || false}
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
      {tabs.map((tab: PageTab) => {
        return (
          <CustomTabPanel key={tab.title} currentTab={currentTab} tabKey={tab.path}>
            {tab.view}
          </CustomTabPanel>
        )
      })}
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
