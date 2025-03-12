import { Container, Grid, Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import ThemeSelectButton from 'src/settings/display/ThemeSelectButton'
import { themeList } from 'src/theme'

export default function DisplayTab() {
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
          {themes}
        </Stack>
      </Stack>
    </Container>
  )
}
