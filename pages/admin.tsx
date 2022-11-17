import React, { ReactElement, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { LogLevel } from '@/types/interfaces'
import Wrapper from '../src/Wrapper'
import FilterMenu, { LogFilters } from '../src/FilterMenu/FilterMenu'
import LogTree from '../src/LogTree/LogTree'

export default function Admin(): ReactElement {
  const theme = useTheme()
  const [logFilters, setLogFilters] = useState<LogFilters>({
    level: LogLevel.TRACE,
    buildId: '',
    requestId: '',
    search: '',
    isRegex: false,
  })

  const handleGetLogs = (filters: LogFilters): void => {
    setLogFilters(filters)
  }

  return (
    <Wrapper title='Admin' page='admin'>
      <Box display='flex' height='calc(100vh - 196px)'>
        <Box
          sx={{
            p: 1,
            backgroundColor: theme.palette.container.main,
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 1,
            flex: 1,
            height: '100%',
          }}
        >
          <Stack direction='column' spacing={1} width='100%' height='100%'>
            <Box display='flex' mx={1}>
              <Box my='auto'>Logs</Box>
              <Box ml='auto'>
                <FilterMenu currentFilters={logFilters} onGetLogs={handleGetLogs} />
              </Box>
            </Box>
            <Divider />
            <Box mx={1} overflow='auto' height='100%'>
              <LogTree query={logFilters} />
            </Box>
          </Stack>
        </Box>
      </Box>
    </Wrapper>
  )
}
