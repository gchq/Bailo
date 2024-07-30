import { Box, Button, Divider, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { grey } from '@mui/material/colors/'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { ReactElement, SyntheticEvent, useContext, useEffect, useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'

export interface PageTab {
  title: string
  path: string
  view: ReactElement
  disabled?: boolean
  hidden?: boolean
  datatest?: string
  disabledText?: string
}

export default function PageWithTabs({
  title,
  tabs,
  actionButtonTitle = '',
  displayActionButton = false,
  actionButtonOnClick,
  requiredUrlParams = {},
  showCopyButton = false,
  textToCopy = '',
  sourceModelId = '',
}: {
  title: string
  tabs: PageTab[]
  actionButtonTitle?: string
  displayActionButton?: boolean
  actionButtonOnClick?: () => void
  requiredUrlParams?: ParsedUrlQuery
  showCopyButton?: boolean
  textToCopy?: string
  sourceModelId?: string
}) {
  const router = useRouter()
  const { tab } = router.query

  const [currentTab, setCurrentTab] = useState('')
  const { unsavedChanges, setUnsavedChanges, sendWarning } = useContext(UnsavedChangesContext)

  useEffect(() => {
    if (!tabs.length) return
    setCurrentTab(tabs.find((pageTab) => pageTab.path === tab) ? `${tab}` : tabs[0].path)
  }, [tab, tabs])

  const tabsList = useMemo(
    () =>
      tabs.reduce<ReactElement[]>((visibleTabs, tab) => {
        if (!tab.hidden) {
          visibleTabs.push(
            tab.disabled ? (
              <Tooltip key={tab.title} title={tab.disabledText}>
                <span>
                  <Tab
                    disabled={tab.disabled}
                    value={tab.path}
                    data-test={`${tab.path}Tab`}
                    label={<span>{tab.title}</span>}
                  />
                </span>
              </Tooltip>
            ) : (
              <Tab
                key={tab.title}
                disabled={tab.disabled}
                value={tab.path}
                data-test={`${tab.path}Tab`}
                label={<span>{tab.title}</span>}
              />
            ),
          )
        }
        return visibleTabs
      }, []),
    [tabs],
  )

  const tabPanels = useMemo(
    () =>
      tabs.map((tab) => (
        <CustomTabPanel key={tab.title} currentTab={currentTab} tabKey={tab.path}>
          {tab.view}
        </CustomTabPanel>
      )),
    [currentTab, tabs],
  )

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

  function continueNavigation(newTab: string) {
    setCurrentTab(newTab)
    setUnsavedChanges(false)
    router.replace({
      query: { ...requiredUrlParams, tab: newTab },
    })
  }

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        divider={<Divider flexItem orientation='vertical' />}
        alignItems='center'
        spacing={{ sm: 2 }}
        sx={{ px: 2, pb: 2 }}
      >
        <Stack direction='row'>
          <Typography component='h1' color='primary' variant='h6'>
            {title}
          </Typography>
          {showCopyButton && (
            <CopyToClipboardButton
              textToCopy={textToCopy ? textToCopy : title}
              notificationText='Copied to clipboard'
              ariaLabel='copy to clipboard'
            />
          )}
        </Stack>
        {displayActionButton && (
          <Button variant='contained' onClick={actionButtonOnClick}>
            {actionButtonTitle}
          </Button>
        )}
        {sourceModelId && <Typography fontWeight='bold'>Mirrored from {sourceModelId} (read-only)</Typography>}
      </Stack>
      <Tabs
        value={currentTab || false}
        onChange={handleChange}
        aria-label='Tabbed view'
        indicatorColor='secondary'
        scrollButtons='auto'
        variant='scrollable'
      >
        {tabsList}
      </Tabs>
      {tabPanels}
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
