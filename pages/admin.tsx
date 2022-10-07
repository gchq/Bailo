import React, { ReactElement } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Wrapper from '../src/Wrapper'
import FilterMenu from '../src/FilterMenu/FilterMenu'
import LogTree from '../src/LogTree'

export default function Admin(): ReactElement {
  const theme = useTheme()

  return (
    <Wrapper title='Admin' page='admin'>
      {/* TODO me - This dodgy height is probably causing the scrolling issue */}
      <Box display='flex' width='100%' height='calc(100vh - 196px)'>
        <Box flex={1} height='100%' overflow='auto'>
          <Box
            sx={{
              p: 1,
              height: '100%',
              backgroundColor: theme.palette.mode === 'light' ? '#f3f1f1' : '#5a5a5a',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 1,
            }}
          >
            <Box mx={1}>Logs</Box>
            <Divider sx={{ my: 1 }} />
            <Box mx={1} height='100%'>
              <Box display='flex' mb={1} width='100%'>
                <Box ml='auto'>
                  <FilterMenu />
                  <Button variant='contained' size='small'>
                    Search
                  </Button>
                </Box>
              </Box>
              <Box mx={1} height='100%' overflow='auto'>
                <LogTree />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Wrapper>
  )
}
