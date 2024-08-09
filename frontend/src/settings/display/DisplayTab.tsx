import { Container, Divider, Grid, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import ThemeCircle from 'src/settings/display/ThemeCircle'
import ThemeSelectButton from 'src/settings/display/ThemeSelectButton'
import { themeList } from 'src/theme'

export default function DisplayTab() {
  const theme = useTheme()
  const themes = useMemo(() => {
    return themeList.map((theme) => (
      <Grid item xs={12} sm={6} key={theme.key}>
        <ThemeSelectButton theme={theme} />
      </Grid>
    ))
  }, [])

  return (
    <Container maxWidth='md'>
      <Stack spacing={2}>
        <Typography fontWeight='bold'>Theme</Typography>
        <Stack direction='row' spacing={2}>
          <ThemeCircle colour={theme.palette.primary.main} />
          <ThemeCircle colour={theme.palette.secondary.main} />
          <ThemeCircle colour={theme.palette.text.primary} />
          <ThemeCircle colour={theme.palette.container.main} />
        </Stack>
        <Divider />
        <Stack direction='row' spacing={2}>
          {themes}
        </Stack>
      </Stack>
    </Container>
  )
}
