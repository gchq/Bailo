import ArticleIcon from '@mui/icons-material/Article'
import BugReportIcon from '@mui/icons-material/BugReport'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import { Paper } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useGetUiConfig } from 'actions/uiConfig'
import Link from 'next/link'
import Loading from 'src/common/Loading'

import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import Wrapper from '../../src/WrapperBeta'

export default function Help() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const error = MultipleErrorWrapper(`Unable to load help page`, {
    isUiConfigError,
  })
  if (error) return error

  return (
    <Wrapper title='Help' page='help'>
      {isUiConfigLoading && <Loading />}
      {uiConfig && (
        <Paper sx={{ py: 5, px: 5 }}>
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography variant='h2' component='h1' color='primary'>
              Contact us
            </Typography>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={12} md={12} lg={4}>
              <Card sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550 }}>
                <CardContent sx={{ height: 320 }}>
                  <BugReportIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
                  <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
                    Bug reports
                  </Typography>
                  <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
                    If you have experienced any issues with Bailo, then please report it to the {uiConfig.issues?.label}
                    .
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant='contained'
                    href={uiConfig.issues?.supportHref}
                    sx={{ mx: 'auto', mb: 2, width: 200 }}
                  >
                    Raise ticket
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={4}>
              <Card sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550 }}>
                <CardContent sx={{ height: 320 }}>
                  <ArticleIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
                  <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
                    Documentation
                  </Typography>
                  <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
                    To find out more about Bailo please see our documentation pages.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Link passHref href='/docs' legacyBehavior>
                    <Button variant='contained' sx={{ mx: 'auto', mb: 2, width: 200 }} data-test='documentationLink'>
                      View documentation
                    </Button>
                  </Link>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={4}>
              <Card sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550 }}>
                <CardContent sx={{ height: 320 }}>
                  <ContactSupportIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
                  <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
                    Get in touch
                  </Typography>
                  <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
                    If you have a general query and need to get in touch, please do so below.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant='contained'
                    href={uiConfig.issues?.contactHref}
                    sx={{ mx: 'auto', mb: 2, width: 200 }}
                  >
                    Get support
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Wrapper>
  )
}
