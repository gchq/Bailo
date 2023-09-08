import { Box, Button, Card, CardContent, CardHeader, Divider, Grid, Stack, Tab, Tabs, Theme } from '@mui/material'
import { styled, ThemeProvider } from '@mui/material/styles'

import { betaLightTheme, darkTheme, earthTheme, lightTheme, sunsetTheme } from '../../../src/theme'
import { User } from '../../../types/types'

interface ThemeTabProps {
  user: User
}

interface ThemeKey {
  name: string
  theme: Theme
}

// TODO - determine how we are storing user themes

export default function ThemeTab({ user }: ThemeTabProps) {
  const themes: ThemeKey[] = [
    { name: 'Bailo Default', theme: betaLightTheme },
    { name: 'Bailo Classic', theme: lightTheme },
    { name: 'Bailo Dark', theme: darkTheme },
    { name: 'Bailo Sunset', theme: sunsetTheme },
    { name: 'Bailo Earth', theme: earthTheme },
  ]

  function userThemeOnChange(themeKey) {
    console.log(`Setting ${themeKey.name} as default theme for ${user.id}`)
  }
  return (
    <Grid container direction='row' justifyContent='center' alignItems='center'>
      {themes.map((theme) => (
        <Grid key={theme.name} item xs={12} sm={4} spacing={2}>
          <ExampleThemeDisplay themeKey={theme} setUserTheme={userThemeOnChange} />
        </Grid>
      ))}
    </Grid>
  )
}

interface TestThemeDisplayProps {
  themeKey: ThemeKey
  setUserTheme: (themeKey: ThemeKey) => void
}

function ExampleThemeDisplay({ themeKey, setUserTheme }: TestThemeDisplayProps) {
  const StyledCardContent = styled(CardContent)({
    position: 'relative',
    padding: 0,
    '.button-container': {
      position: 'absolute',
      padding: '16px',
      zIndex: 2,
      display: 'none',
      margin: 'auto',
      height: '100%',
      width: '100%',
    },
    '.display-container': {
      padding: '16px',
    },
    '&:hover .button-container': {
      display: 'block',
    },
    '&:hover .display-container': {
      filter: 'blur(2px)',
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
  })

  return (
    <ThemeProvider theme={themeKey.theme}>
      <Card sx={{ m: 2 }} variant={themeKey.theme.palette.mode === 'light' ? 'outlined' : 'elevation'}>
        <CardHeader
          title={themeKey.name}
          sx={{
            backgroundColor: themeKey.theme.palette.primary.main,
            color: themeKey.theme.palette.mode === 'light' ? 'white' : 'black',
          }}
        />
        <Box sx={{ backgroundColor: themeKey.theme.palette.secondary.main, width: '100%', height: '12px' }}></Box>
        <StyledCardContent>
          <Box className='button-container'>
            <Stack justifyContent='center' justifyItems='center' sx={{ height: '100%' }}>
              <Button variant='contained' onClick={() => setUserTheme(themeKey)}>
                Use theme
              </Button>
            </Stack>
          </Box>
          <Box className='display-container'>
            <Stack spacing={2}>
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
                <Button
                  component='div'
                  aria-label='Example primary colour contained button'
                  size='small'
                  variant='contained'
                >
                  Text
                </Button>
                <Button
                  component='div'
                  aria-label='Example primary colour outlined button'
                  size='small'
                  variant='outlined'
                >
                  Text
                </Button>
                <Button component='div' aria-label='Example primary colour text button' size='small'>
                  Text
                </Button>
              </Stack>
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
                <Button
                  component='div'
                  aria-label='Example secondary colour contained button'
                  size='small'
                  variant='contained'
                  color='secondary'
                >
                  Text
                </Button>
                <Button
                  component='div'
                  aria-label='Example secondary colour outlined button'
                  size='small'
                  variant='outlined'
                  color='secondary'
                >
                  Text
                </Button>
                <Button
                  component='div'
                  aria-label='Example secondary colour text button'
                  size='small'
                  color='secondary'
                >
                  Text
                </Button>
              </Stack>
              <Tabs value={0} indicatorColor='secondary'>
                <Tab label='Tab 1' value={0} />
                <Tab label='Tab 2' value={1} />
              </Tabs>
            </Stack>
          </Box>
        </StyledCardContent>
        <Divider flexItem />
      </Card>
    </ThemeProvider>
  )
}
