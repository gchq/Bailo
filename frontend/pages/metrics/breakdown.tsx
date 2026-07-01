import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack } from '@mui/material'
import Title from 'src/common/Title'
import Link from 'src/Link'

export default function MetricsTable() {
  return (
    <>
      <Title text='Metrics' />
      <Container maxWidth='md' sx={{ my: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={2}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Link href={`/metrics`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to metrics
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
