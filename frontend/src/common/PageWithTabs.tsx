import { Box, Button, Divider, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { grey } from '@mui/material/colors'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { ReactElement, SyntheticEvent, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react'
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

interface PageWithTabsProps {
  title: string
  subheading?: string
  additionalInfo?: string
  tabs: PageTab[]
  actionButtonTitle?: string
  displayActionButton?: boolean
  actionButtonOnClick?: () => void
  requiredUrlParams?: ParsedUrlQuery
  titleToCopy?: string
  subheadingToCopy?: string
  additionalHeaderDisplay?: ReactElement
  actionButtonIcon?: ReactElement
}

export default function PageWithTabs({
  title,
  subheading,
  additionalInfo,
  tabs,
  actionButtonTitle = '',
  displayActionButton = false,
  actionButtonOnClick,
  requiredUrlParams = {},
  titleToCopy = '',
  subheadingToCopy = '',
  additionalHeaderDisplay,
  actionButtonIcon,
}: PageWithTabsProps) {
  const router = useRouter()
  const { tab } = router.query

  const [currentTab, setCurrentTab] = useState('')
  const { unsavedChanges, setUnsavedChanges, sendWarning } = useContext(UnsavedChangesContext)
  const [showFullText, setShowFullText] = useState(false)
  const theme = useTheme()

  const currentTabChanged = useEffectEvent((newTab: string) => {
    setCurrentTab(newTab)
  })

  useEffect(() => {
    if (!tabs.length) {
      return
    }
    currentTabChanged(tabs.find((pageTab) => pageTab.path === tab) ? `${tab}` : tabs[0].path)
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

  const announcementText = useMemo(() => {
    if (!additionalInfo) {
      return
    }
    return additionalInfo.length > 100 ? (
      <Typography sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
        {showFullText ? additionalInfo : `${additionalInfo.slice(0, 100)}...`}
        <Button sx={{ ml: 1 }} variant='text' size='small' onClick={() => setShowFullText(!showFullText)}>
          {showFullText ? 'Show less' : 'Show more'}
        </Button>
      </Typography>
    ) : (
      additionalInfo
    )
  }, [additionalInfo, showFullText])

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
        divider={<Divider flexItem orientation='vertical' />}
        alignItems='center'
        spacing={{ xs: 1, sm: 2 }}
        sx={{ pb: 2, px: 2 }}
        direction={{ xs: 'column', sm: 'row' }}
      >
        <Stack overflow='auto' sx={{ maxWidth: 'md' }}>
          <Stack textOverflow='ellipsis' overflow='hidden' direction='row'>
            <Tooltip title={title}>
              <Typography component='h1' color='primary' variant='h6' noWrap>
                {title}
              </Typography>
            </Tooltip>
            {titleToCopy.length > 0 && (
              <CopyToClipboardButton
                textToCopy={titleToCopy ? titleToCopy : title}
                notificationText='Copied to clipboard'
                ariaLabel='copy to clipboard'
              />
            )}
          </Stack>
          {subheading && (
            <Stack direction='row' alignItems='center'>
              <Typography
                variant='caption'
                sx={{ color: theme.palette.primary.main, textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {subheading}
              </Typography>
              {subheadingToCopy.length > 0 && (
                <CopyToClipboardButton
                  textToCopy={subheadingToCopy ? subheadingToCopy : subheading}
                  notificationText='Copied to clipboard'
                  ariaLabel='copy to clipboard'
                />
              )}
            </Stack>
          )}
        </Stack>
        {displayActionButton && (
          <Button
            sx={{ minWidth: '154px' }}
            variant='contained'
            onClick={actionButtonOnClick}
            startIcon={actionButtonIcon ? actionButtonIcon : <></>}
          >
            {actionButtonTitle}
          </Button>
        )}
        {additionalHeaderDisplay}
      </Stack>
      <Box
        sx={{
          pl: 2,
          pb: 1,
          flexGrow: 1,
          minWidth: 0,
          maxWidth: '900px',
        }}
      >
        {announcementText}
      </Box>
      <Tabs
        value={currentTab || false}
        onChange={handleChange}
        aria-label='Tabbed view'
        indicatorColor='secondary'
        scrollButtons='auto'
        variant='scrollable'
        allowScrollButtonsMobile
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

  return (
    <div role='tabpanel' hidden={currentTab !== tabKey} {...other}>
      {currentTab === tabKey && (
        <Box
          sx={(theme) => ({
            // TODO - use "theme.applyStyles" when implementing dark mode
            backgroundColor: grey[800],
            p: 2,
            mb: 2,
            ...theme.applyStyles('light', {
              backgroundColor: 'white',
            }),
          })}
        >
          {children}
        </Box>
      )}
    </div>
  )
}
