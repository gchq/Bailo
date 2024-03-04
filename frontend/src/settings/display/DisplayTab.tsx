import { Container, Grid, Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import ExampleDisplay from 'src/settings/display/ExampleDisplay'
import { themeList } from 'src/theme'

export default function DisplayTab() {
  const themes = useMemo(() => {
    return themeList.map((theme) => (
      <Grid item key={theme.key}>
        <ExampleDisplay theme={theme} />
      </Grid>
    ))
  }, [])

  return (
    <Container maxWidth='md'>
      <Stack spacing={2}>
        <Typography fontWeight='bold'>Theme</Typography>
        <Stack spacing={1}>{themes}</Stack>
      </Stack>
    </Container>
  )
}
