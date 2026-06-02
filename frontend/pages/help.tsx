import BugReportIcon from '@mui/icons-material/BugReport'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import { Container, Divider, Paper, Stack } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'

export default function Help() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const error = MultipleErrorWrapper(`Unable to load help page`, {
    isUiConfigError,
  })
  if (error) {
    return error
  }

  return (
    <Container maxWidth='xl' sx={{ pb: 2 }}>
      <Title text='Help' />
      {isUiConfigLoading && <Loading />}
      {uiConfig && (
        <Paper sx={{ py: 5, px: 5 }}>
          <Stack direction={{ md: 'row', sm: 'column' }} divider={<Divider flexItem orientation='vertical' />}>
            <Box sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550, minHeight: '320px' }}>
              <BugReportIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
              <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
                Bug reports
              </Typography>
              <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
                If you have experienced any issues with Bailo, then please report it to the {uiConfig.issues?.label}.
              </Typography>
              <Button variant='contained' href={uiConfig.issues?.supportHref} sx={{ mx: 'auto', mb: 2, width: 200 }}>
                Raise ticket
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550, minHeight: '320px' }}>
              <ContactSupportIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
              <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
                Get in touch
              </Typography>
              <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
                If you have a general query and need to get in touch, please do so below.
              </Typography>
              <Button variant='contained' href={uiConfig.issues?.contactHref} sx={{ mx: 'auto', mb: 2, width: 200 }}>
                Get support
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}
    </Container>
  )
}
