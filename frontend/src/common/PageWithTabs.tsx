import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material'
import { grey } from '@mui/material/colors/'
import { useTheme } from '@mui/material/styles'
import { ReactElement, useState } from 'react'

export interface PageTab {
  title: string
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
  const [value, setValue] = useState(0)

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  return (
    <>
      <Box>
        <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2} sx={{ p: 2 }}>
          <Typography component='h1' color='primary' variant='h6'>
            {title}
          </Typography>
          {displayActionButton && (
            <Button variant='contained' hidden={!displayActionButton} onClick={actionButtonOnClick}>
              {actionButtonTitle}
            </Button>
          )}
        </Stack>
        <Tabs value={value} onChange={handleChange} aria-label='Tabbed view' indicatorColor='secondary'>
          {tabs.map((tab: PageTab) => {
            return <Tab key={tab.title} label={tab.title} disabled={tab.disabled} />
          })}
        </Tabs>
      </Box>
      <Box sx={{}}>
        {tabs.map((tab: PageTab, index: number) => {
          return (
            <CustomTabPanel key={tab.title} value={value} index={index}>
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
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  const theme = useTheme()

  return (
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && (
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
